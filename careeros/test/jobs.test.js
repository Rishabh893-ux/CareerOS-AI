// Job tracker route tests. Stubs the Mongoose model, so no database is needed.
process.env.JWT_SECRET = "test-secret";

const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const JobApplication = require("../models/JobApplication");
const jobsRouter = require("../routes/jobs");
const { formatSalary } = require("../routes/jobs");

const original = { findOne: JobApplication.findOne, create: JobApplication.create };
let server, baseUrl, store;
const token = jwt.sign({ userId: "u1" }, process.env.JWT_SECRET);
const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

// A tiny stand-in for a Mongoose document
const doc = (data) => ({ ...data, async save() { store.set(this._id, this); return this; } });

before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/jobs", jobsRouter);
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/jobs`;
});

after(() => {
  Object.assign(JobApplication, original);
  server.close();
});

beforeEach(() => {
  store = new Map();
  JobApplication.findOne = async (q) =>
    [...store.values()].find((j) => j.user === q.user && (q._id ? j._id === q._id : true) && (q.jobUrl ? j.jobUrl === q.jobUrl : true)) || null;
  JobApplication.create = async (data) => {
    const j = doc({ _id: `j${store.size + 1}`, ...data });
    store.set(j._id, j);
    return j;
  };
});

const post = (body) => fetch(baseUrl, { method: "POST", headers, body: JSON.stringify(body) });
const put = (id, body) => fetch(`${baseUrl}/${id}`, { method: "PUT", headers, body: JSON.stringify(body) });

test("tracking the same posting twice is refused with the existing job", async () => {
  assert.equal((await post({ company: "Acme", role: "SDE", jobUrl: "https://jobs/1" })).status, 201);
  const res = await post({ company: "Acme", role: "SDE", jobUrl: "https://jobs/1" });
  assert.equal(res.status, 409);
  assert.equal((await res.json()).job.company, "Acme");
});

test("a job added straight to Applied gets today's applied date; Wishlist doesn't", async () => {
  const applied = await (await post({ company: "A", role: "R", status: "Applied" })).json();
  const wish = await (await post({ company: "B", role: "R" })).json();
  assert.ok(applied.appliedOn);
  assert.equal(wish.appliedOn, undefined);
  assert.equal(wish.status, "Wishlist");
});

test("moving a job out of Wishlist records the applied date once", async () => {
  const { _id } = await (await post({ company: "A", role: "R" })).json();
  const moved = await (await put(_id, { status: "Applied" })).json();
  assert.ok(moved.appliedOn);
  const later = await (await put(_id, { status: "Interviewing" })).json();
  assert.equal(later.appliedOn, moved.appliedOn);
});

test("changing the job description queues a fresh match", async () => {
  const { _id } = await (await post({ company: "A", role: "R" })).json();
  const updated = await (await put(_id, { jobDescription: "We need React and Node.js engineers to build our platform." })).json();
  assert.equal(updated.matchStatus, "pending");
});

test("salaries are formatted in the local currency", () => {
  assert.equal(formatSalary(600000, 900000, "in"), "₹6,00,000 – ₹9,00,000");
  assert.equal(formatSalary(85000, 85000, "us"), "$85,000");
  assert.equal(formatSalary(undefined, undefined, "in"), "");
});
