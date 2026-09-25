// Auth route tests. Uses Node's built-in test runner and stubs the Mongoose
// models, so no database is needed. Run with: npm test
process.env.JWT_SECRET = "test-secret";

const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Profile = require("../models/Profile");
const authRouter = require("../routes/auth");

const original = {
  userFindOne: User.findOne,
  userFindById: User.findById,
  userCreate: User.create,
  profileCreate: Profile.create,
};

let server;
let baseUrl;
let users; // in-memory stand-in for the users collection

function post(path, body) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/auth`;
});

after(() => {
  User.findOne = original.userFindOne;
  User.findById = original.userFindById;
  User.create = original.userCreate;
  Profile.create = original.profileCreate;
  server.close();
});

beforeEach(() => {
  users = [];
  // Mirrors the schema: email is saved lowercased and trimmed.
  User.findOne = async (query) => users.find((u) => u.email === query.email) || null;
  User.findById = (id) => ({
    select: async () => users.find((u) => u._id === String(id)) || null,
  });
  User.create = async ({ name, email, passwordHash }) => {
    const user = { _id: String(users.length + 1), name, email: email.trim().toLowerCase(), passwordHash };
    users.push(user);
    return user;
  };
  Profile.create = async () => ({});
});

async function seedUser(email, password) {
  users.push({ _id: "42", name: "Ada", email, passwordHash: await bcrypt.hash(password, 4) });
}

test("register rejects missing fields", async () => {
  const res = await post("/register", { email: "a@b.com" });
  assert.equal(res.status, 400);
});

test("register creates a user and returns a token", async () => {
  const res = await post("/register", { name: "Ada", email: "ada@example.com", password: "pw123456" });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.token);
  assert.equal(body.user.email, "ada@example.com");
});

test("register treats differently-cased emails as the same account", async () => {
  await seedUser("ada@example.com", "pw123456");
  const res = await post("/register", { name: "Ada", email: " Ada@Example.com ", password: "pw123456" });
  assert.equal(res.status, 409);
});

test("login succeeds regardless of email case and surrounding spaces", async () => {
  await seedUser("ada@example.com", "pw123456");
  const res = await post("/login", { email: "  ADA@Example.COM ", password: "pw123456" });
  assert.equal(res.status, 200);
  assert.ok((await res.json()).token);
});

test("login rejects a wrong password", async () => {
  await seedUser("ada@example.com", "pw123456");
  const res = await post("/login", { email: "ada@example.com", password: "nope" });
  assert.equal(res.status, 401);
});

test("login rejects an unknown email with the same message", async () => {
  const res = await post("/login", { email: "ghost@example.com", password: "pw123456" });
  assert.equal(res.status, 401);
  assert.equal((await res.json()).error, "Invalid credentials");
});

test("/me requires a token", async () => {
  const res = await fetch(`${baseUrl}/me`);
  assert.equal(res.status, 401);
});

test("/me rejects a token signed with another secret", async () => {
  const token = jwt.sign({ userId: "42" }, "wrong-secret");
  const res = await fetch(`${baseUrl}/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 401);
});

test("/me returns 404 'User not found' for a valid token whose account is gone", async () => {
  // The frontend relies on this exact message to sign the person out.
  const token = jwt.sign({ userId: "999" }, process.env.JWT_SECRET);
  const res = await fetch(`${baseUrl}/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 404);
  assert.equal((await res.json()).error, "User not found");
});

test("/me returns the user for a valid token", async () => {
  await seedUser("ada@example.com", "pw123456");
  const token = jwt.sign({ userId: "42" }, process.env.JWT_SECRET);
  const res = await fetch(`${baseUrl}/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).email, "ada@example.com");
});

function settings(body, userId = "42") {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return fetch(`${baseUrl}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

function captureSettingsUpdate() {
  const calls = [];
  const originalUpdate = User.findByIdAndUpdate;
  User.findByIdAndUpdate = (id, update) => {
    calls.push(update);
    return { select: async () => ({ _id: id }) };
  };
  return { calls, restore: () => { User.findByIdAndUpdate = originalUpdate; } };
}

test("PUT /settings with only githubUsername leaves name and username alone", async () => {
  const spy = captureSettingsUpdate();
  try {
    const res = await settings({ githubUsername: "octocat" });
    assert.equal(res.status, 200);
    assert.deepEqual(spy.calls[0], { $set: { githubUsername: "octocat" } });
  } finally {
    spy.restore();
  }
});

test("PUT /settings with an empty username removes it instead of storing \"\"", async () => {
  const spy = captureSettingsUpdate();
  try {
    const res = await settings({ name: "Ada", username: "" });
    assert.equal(res.status, 200);
    assert.deepEqual(spy.calls[0], { $set: { name: "Ada" }, $unset: { username: "" } });
  } finally {
    spy.restore();
  }
});
