const fetch = require("node-fetch");
const UsageLog = require("../models/UsageLog");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const DAILY_LIMIT = parseInt(process.env.GEMINI_DAILY_LIMIT || "1400", 10);

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

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
  const logs = await UsageLog.find({ date: todayKey() });
  return logs.reduce((sum, l) => sum + l.count, 0);
}

/**
 * Central function for all Gemini calls across every module.
 *
 * @param {string} feature - one of UsageLog enum values, used for tracking
 * @param {string} prompt - the full prompt text
 * @param {object} options - { jsonSchemaHint, fallbackData }
 * @returns {object} { success, data, fromCache, error }
 */
async function callGemini(feature, prompt, options = {}) {
  // 1. Check daily quota before calling
  const totalToday = await getTotalUsageToday();
  if (totalToday >= DAILY_LIMIT) {
    return {
      success: false,
      data: options.fallbackData || null,
      fromCache: !!options.fallbackData,
      error: "Daily Gemini quota reached. Serving cached/fallback data.",
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
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
    };

    if (options.jsonSchemaHint) {
      body.generationConfig = { response_mime_type: "application/json" };
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const json = await response.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    await incrementUsage(feature);

    let data = text;
    if (options.jsonSchemaHint) {
      try {
        let cleanText = text.replace(/```json|```/g, "").trim();
        const startIdx = cleanText.indexOf('{');
        const endIdx = cleanText.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          cleanText = cleanText.substring(startIdx, endIdx + 1);
        }
        data = JSON.parse(cleanText);
      } catch (e) {
        console.warn("[Gemini] Failed to parse JSON. Raw text was:", text.substring(0, 200));
        // model didn't return clean JSON - return raw text, caller decides what to do
      }
    }

    return { success: true, data, fromCache: false, error: null };
  } catch (err) {
    console.error(`[Gemini:${feature}] Error:`, err.message);
    return {
      success: false,
      data: options.fallbackData || null,
      fromCache: !!options.fallbackData,
      error: err.message,
    };
  }
}

module.exports = { callGemini, getTodayUsage, getTotalUsageToday };
