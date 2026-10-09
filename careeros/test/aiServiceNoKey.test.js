// Runs in its own process (node --test isolates files), so GROQ_API_KEY can be unset.
delete process.env.GROQ_API_KEY;

const { test } = require("node:test");
const assert = require("node:assert/strict");

let fetchCalls = 0;
global.fetch = async () => { fetchCalls += 1; };

const { callAI } = require("../services/aiService");

test("a missing API key gives a clear error without calling Groq", async () => {
  const r = await callAI("ai_copilot", "p", { userId: "u1" });
  assert.equal(r.success, false);
  assert.match(r.error, /GROQ_API_KEY/);
  assert.equal(fetchCalls, 0);
});
