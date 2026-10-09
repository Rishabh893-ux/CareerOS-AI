// Auth rate limit tests. Mounts the real limiters on throwaway routes, so no
// database is needed.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const rateLimits = require("../middleware/rateLimits");

let server, baseUrl;

before(async () => {
  const app = express();
  app.post("/login", rateLimits.login, (req, res) => res.json({ ok: true }));
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test("login allows 10 attempts per 15 minutes, then answers 429 with the app's error shape", async () => {
  for (let i = 0; i < 10; i++) {
    assert.equal((await fetch(`${baseUrl}/login`, { method: "POST" })).status, 200, `attempt ${i + 1}`);
  }
  const blocked = await fetch(`${baseUrl}/login`, { method: "POST" });
  assert.equal(blocked.status, 429);
  assert.match((await blocked.json()).error, /Too many sign-in attempts/);
  assert.ok(blocked.headers.get("retry-after"), "tells the client when to retry");
});
