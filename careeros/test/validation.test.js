// Request validation tests (middleware/validate.js + validation/schemas.js).
// Mounts the middleware on a throwaway route, so no database is needed.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const validate = require("../middleware/validate");
const schemas = require("../validation/schemas");

let server, baseUrl;

before(async () => {
  const app = express();
  app.use(express.json());
  // Echo what the route would receive after validation
  for (const [name, schema] of Object.entries(schemas)) {
    app.post(`/${name}`, validate(schema), (req, res) => res.json(req.body));
  }
  app.get("/jobSearch", validate(schemas.jobSearch, "query"), (req, res) => res.json(req.query));
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const post = (path, body) =>
  fetch(`${baseUrl}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("a reset token that's a Mongo operator is rejected before it reaches the query", async () => {
  const res = await post("resetPassword", { token: { $ne: null }, password: "new-password" });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, "Password reset token is invalid or has expired");
});

test("a real-looking reset token passes", async () => {
  const res = await post("resetPassword", { token: "a".repeat(40), password: "new-password" });
  assert.equal(res.status, 200);
});

test("login rejects a non-string password with a field-named message", async () => {
  const res = await post("login", { email: "ada@example.com", password: { $gt: "" } });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /^password: /);
});

test("missing required fields keep the routes' own messages", async () => {
  const res = await post("jobCreate", { company: "Acme" });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, "Company and role are required.");
});

test("unknown fields are stripped, so they can't be mass-assigned", async () => {
  const res = await post("jobCreate", { company: "Acme", role: "SDE", user: "someone-else", matchPercentage: 100 });
  assert.deepEqual(await res.json(), { company: "Acme", role: "SDE" });
});

test("partial updates only carry the fields that were sent", async () => {
  const res = await post("jobUpdate", { status: "Applied" });
  assert.deepEqual(await res.json(), { status: "Applied" });
});

test("profile saves accept entries parsed from a resume, with nulls and Mongo ids", async () => {
  const res = await post("profileUpdate", {
    education: [{ _id: "abc", institute: "IIT Delhi", degree: null, cgpa: null, graduationYear: 2026 }],
    experience: [{ company: "Acme", role: "Intern", description: "Built things" }],
    certifications: [{ name: "AWS CCP", link: "" }],
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.education[0]._id, undefined);
  assert.equal(body.education[0].institute, "IIT Delhi");
  assert.equal(body.certifications[0].name, "AWS CCP");
});

test("oversized input is rejected", async () => {
  const res = await post("copilotAsk", { question: "x".repeat(2001) });
  assert.equal(res.status, 400);
});

test("interview type must be HR or Technical", async () => {
  const res = await post("interviewGenerate", { type: "Coding" });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, 'type must be "HR" or "Technical"');
});

test("job search rejects repeated query params instead of crashing on an array", async () => {
  const res = await fetch(`${baseUrl}/jobSearch?what=react&what=node`);
  assert.equal(res.status, 400);
});
