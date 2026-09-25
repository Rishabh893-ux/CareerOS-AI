const UsageLog = require("../models/UsageLog");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TEXT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const VISION_MODEL = process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b";
const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT || "1400", 10);

const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// --- Simple in-memory token bucket so one user spamming AI Copilot
// can't burn the whole day's quota in a few seconds. Resets every minute.
const RATE_LIMIT_PER_MINUTE = 10;
let bucket = RATE_LIMIT_PER_MINUTE;
setInterval(() => {
  bucket = RATE_LIMIT_PER_MINUTE;
}, 60 * 1000);

function todayKey() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

async function getTodayUsage(feature) {
  const log = await UsageLog.findOne({ date: todayKey(), feature });
  return log ? log.count : 0;
}

async function incrementUsage(feature) {
  await UsageLog.findOneAndUpdate(
    { date: todayKey(), feature },
    { $inc: { count: 1 } },
    { upsert: true }
  );
}

async function getTotalUsageToday() {
  const [result] = await UsageLog.aggregate([
    { $match: { date: todayKey() } },
    { $group: { _id: null, total: { $sum: "$count" } } },
  ]);
  return result?.total || 0;
}

/**
 * Low-level call to Groq's OpenAI-compatible chat completions API. Shared by
 * callAI() (text prompts, gpt-oss-120b) and the resume-parsing vision
 * path (image content blocks, qwen3.8-27b - the only vision model Groq offers).
 *
 * @param {Array} messages - OpenAI-style messages array (may include multimodal content blocks)
 * @param {object} options - { jsonMode, model }
 * @returns {string} the assistant's text reply
 */
async function chatCompletion(messages, options = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model || TEXT_MODEL,
      max_tokens: 8000,
      messages,
      ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const errMessage = errBody?.error?.message || `HTTP ${response.status}`;
    if (response.status === 401) {
      throw new Error("Invalid Groq API key.");
    }
    if (response.status === 429) {
      throw new Error("API Rate Limit Reached! Please wait about 1 minute and try again.");
    }
    throw new Error(`Groq API error ${response.status}: ${errMessage}`);
  }

  const json = await response.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Empty response from Groq");
  }
  return text;
}

/**
 * Central function for all Groq calls across every module.
 *
 * @param {string} feature - one of UsageLog enum values, used for tracking
 * @param {string} prompt - the full prompt text
 * @param {object} options - { jsonSchemaHint, fallbackData }
 * @returns {object} { success, data, fromCache, error }
 */
async function callAI(feature, prompt, options = {}) {
  // 1. Check daily quota before calling
  const totalToday = await getTotalUsageToday();
  if (totalToday >= DAILY_LIMIT) {
    return {
      success: false,
      data: options.fallbackData || null,
      fromCache: !!options.fallbackData,
      error: "Daily AI quota reached. Serving cached/fallback data.",
    };
  }

  // 2. Check per-minute rate limit bucket
  if (bucket <= 0) {
    return {
      success: false,
      data: options.fallbackData || null,
      fromCache: !!options.fallbackData,
      error: "Rate limit hit. Try again shortly.",
    };
  }
  bucket -= 1;

  try {
    const messages = [];
    if (options.jsonSchemaHint) {
      messages.push({
        role: "system",
        content: "Respond with valid JSON only. No markdown code fences, no explanation before or after the JSON.",
      });
    }
    messages.push({ role: "user", content: prompt });

    const text = await chatCompletion(messages, { jsonMode: !!options.jsonSchemaHint });

    await incrementUsage(feature);

    let data = text;
    if (options.jsonSchemaHint) {
      try {
        let cleanText = text.replace(/```json|```/g, "").trim();
        const firstBrace = cleanText.indexOf('{');
        const firstBracket = cleanText.indexOf('[');
        const isArray =
          firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace);
        const startIdx = isArray ? firstBracket : firstBrace;
        const endIdx = isArray ? cleanText.lastIndexOf(']') : cleanText.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          cleanText = cleanText.substring(startIdx, endIdx + 1);
        }
        data = JSON.parse(cleanText);
      } catch (e) {
        console.warn("[Groq] Failed to parse JSON. Raw text was:", text.substring(0, 200));
        // model didn't return clean JSON - return raw text, caller decides what to do
      }
    }

    return { success: true, data, fromCache: false, error: null };
  } catch (err) {
    console.error(`[Groq:${feature}] Error:`, err.message);
    return {
      success: false,
      data: options.fallbackData || null,
      fromCache: !!options.fallbackData,
      error: err.message,
    };
  }
}

module.exports = { TEXT_MODEL, VISION_MODEL, chatCompletion, callAI, getTodayUsage, getTotalUsageToday };
