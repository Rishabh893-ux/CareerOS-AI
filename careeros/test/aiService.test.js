// AI service guardrail tests. Stubs fetch and the UsageLog model, so no
// network or database is needed. Limits are set low to make them easy to hit.
process.env.GROQ_API_KEY = "test-key";
process.env.AI_USER_RATE_LIMIT = "2";
process.env.AI_GLOBAL_RATE_LIMIT = "3";
process.env.AI_DAILY_LIMIT = "100";

const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const UsageLog = require("../models/UsageLog");

let usageToday, groqReply, groqCalls;
UsageLog.aggregate = async () => [{ total: usageToday }];
UsageLog.findOneAndUpdate = async () => { usageToday += 1; };
global.fetch = async () => {
  groqCalls += 1;
  return { ok: true, json: async () => ({ choices: [{ message: { content: groqReply } }] }) };
};

const { callAI, callVision, resetRateLimits } = require("../services/aiService");

beforeEach(() => {
  resetRateLimits();
  usageToday = 0;
  groqReply = '{"ok":true}';
  groqCalls = 0;
});

const ask = (userId) => callAI("ai_copilot", "p", { userId });

test("parsed JSON comes back as an object", async () => {
  const r = await callAI("career_score", "p", { jsonSchemaHint: true, userId: "u1" });
  assert.equal(r.success, true);
  assert.deepEqual(r.data, { ok: true });
});

test("unparseable JSON is a failure that serves the fallback, not a raw string", async () => {
  groqReply = "Sorry, I can't help with that.";
  const r = await callAI("career_score", "p", { jsonSchemaHint: true, userId: "u1", fallbackData: { score: 70 } });
  assert.equal(r.success, false);
  assert.equal(r.fromCache, true);
  assert.deepEqual(r.data, { score: 70 });
});

test("the daily quota stops calls before they reach Groq", async () => {
  usageToday = 100;
  const r = await ask("u1");
  assert.equal(r.success, false);
  assert.match(r.error, /Daily AI quota/);
  assert.equal(groqCalls, 0);
});

test("a user over their own limit doesn't block other users", async () => {
  assert.equal((await ask("a")).success, true);
  assert.equal((await ask("a")).success, true);
  assert.match((await ask("a")).error, /too quickly/);
  assert.equal((await ask("b")).success, true);
});

test("the global cap applies across all users", async () => {
  for (const user of ["a", "b", "c"]) assert.equal((await ask(user)).success, true);
  assert.match((await ask("d")).error, /AI service is busy/);
  assert.equal(groqCalls, 3);
});

test("vision calls go through the same guardrails and throw when blocked", async () => {
  usageToday = 100;
  await assert.rejects(callVision("resume_ocr", [], { userId: "u1" }), /Daily AI quota/);
  assert.equal(groqCalls, 0);
});

test("vision calls count towards usage when they succeed", async () => {
  groqReply = "Ada Lovelace\nSoftware Engineer";
  assert.equal(await callVision("resume_ocr", [], { userId: "u1" }), "Ada Lovelace\nSoftware Engineer");
  assert.equal(usageToday, 1);
});
