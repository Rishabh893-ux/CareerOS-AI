const UsageLog = require("../models/UsageLog");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TEXT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const VISION_MODEL = process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b";
const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT || "1400", 10);

const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// --- Simple in-memory rate limits, reset every minute. The per-user limit stops
// one user spamming AI Copilot from locking everyone else out; the global limit
// protects the shared Groq key. Both are per process.
const USER_RATE_LIMIT_PER_MINUTE = parseInt(process.env.AI_USER_RATE_LIMIT || "10", 10);
const GLOBAL_RATE_LIMIT_PER_MINUTE = parseInt(process.env.AI_GLOBAL_RATE_LIMIT || "30", 10);
let globalCallsThisMinute = 0;
const userCallsThisMinute = new Map(); // userId -> calls this minute
function resetRateLimits() {
  globalCallsThisMinute = 0;
  userCallsThisMinute.clear();
}
// unref() so this timer alone doesn't keep the process (or a test run) alive.
setInterval(resetRateLimits, 60 * 1000).unref();

/** Takes one call from the user's and the global allowance; returns an error message if either is used up. */
function takeRateLimitToken(userId) {
  const key = userId ? String(userId) : null;
  const userCalls = key ? userCallsThisMinute.get(key) || 0 : 0;
  if (key && userCalls >= USER_RATE_LIMIT_PER_MINUTE) {
    return "You're sending AI requests too quickly. Try again in a minute.";
  }
  if (globalCallsThisMinute >= GLOBAL_RATE_LIMIT_PER_MINUTE) {
    return "The AI service is busy right now. Try again in a minute.";
  }
  globalCallsThisMinute += 1;
  if (key) userCallsThisMinute.set(key, userCalls + 1);
  return null;
}

const MISSING_KEY_ERROR = "Groq API key is not configured. Set GROQ_API_KEY in the backend environment.";

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
  if (!GROQ_API_KEY) {
    throw new Error(MISSING_KEY_ERROR);
  }

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
 * The checks every Groq call passes before it's sent: API key configured,
 * daily quota not reached, per-user and global rate limits not hit.
 * Takes a rate-limit token when it passes.
 *
 * @returns {string|null} why the call is blocked, or null if it may go ahead
 */
async function checkGuardrails(userId) {
  // Fail fast (without spending quota or rate-limit tokens) if no key is set
  if (!GROQ_API_KEY) return MISSING_KEY_ERROR;

  const totalToday = await getTotalUsageToday();
  if (totalToday >= DAILY_LIMIT) return "Daily AI quota reached. Serving cached/fallback data.";

  return takeRateLimitToken(userId);
}

/**
 * Vision (OCR) calls for resume parsing. Same guardrails as callAI(), but
 * throws on failure, matching how the text extractor handles errors.
 *
 * @param {string} feature - one of UsageLog enum values, used for tracking
 * @param {Array} messages - OpenAI-style messages with image content blocks
 * @param {object} options - { userId }
 * @returns {string} the extracted text
 */
async function callVision(feature, messages, options = {}) {
  const blocked = await checkGuardrails(options.userId);
  if (blocked) throw new Error(blocked);

  const text = await chatCompletion(messages, { model: VISION_MODEL });
  await incrementUsage(feature);
  return text;
}

/**
 * Central function for all Groq text calls across every module.
 *
 * @param {string} feature - one of UsageLog enum values, used for tracking
 * @param {string} prompt - the full prompt text
 * @param {object} options - { jsonSchemaHint, fallbackData, userId } (userId applies the per-user rate limit)
 * @returns {object} { success, data, fromCache, error }
 */
async function callAI(feature, prompt, options = {}) {
  const failure = (error) => ({
    success: false,
    data: options.fallbackData || null,
    fromCache: !!options.fallbackData,
    error,
  });

  const blocked = await checkGuardrails(options.userId);
  if (blocked) return failure(blocked);

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
      // Callers that ask for JSON read fields off `data`, so unparseable output
      // is a failure, not a success with a raw string.
      const parseFailure = failure("AI returned an invalid response. Please try again.");
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
        console.warn(`[Groq:${feature}] Failed to parse JSON. Raw text was:`, text.substring(0, 200));
        return parseFailure;
      }
      if (!data || typeof data !== "object") {
        console.warn(`[Groq:${feature}] Expected a JSON object/array, got:`, typeof data);
        return parseFailure;
      }
    }

    return { success: true, data, fromCache: false, error: null };
  } catch (err) {
    console.error(`[Groq:${feature}] Error:`, err.message);
    return failure(err.message);
  }
}

module.exports = { TEXT_MODEL, VISION_MODEL, chatCompletion, callAI, callVision, getTodayUsage, getTotalUsageToday, resetRateLimits };
