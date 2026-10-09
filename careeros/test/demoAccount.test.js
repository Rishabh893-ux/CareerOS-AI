// Demo account reset tests. Stubs the Mongoose models, so no database is needed.
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const User = require("../models/User");
const Profile = require("../models/Profile");
const JobApplication = require("../models/JobApplication");
const InterviewSession = require("../models/InterviewSession");
const { DEMO_EMAIL, getFreshDemoUser } = require("../services/demoAccount");

const DAY = 24 * 60 * 60 * 1000;
let user, profile, jobs, interviews, profilesCreated;

beforeEach(() => {
  user = { _id: "demo1", email: DEMO_EMAIL, name: "Vandalised", username: "demo" };
  profile = { user: "demo1", createdAt: new Date() };
  jobs = [{ user: "demo1", company: "Junk Inc" }];
  interviews = [{ user: "demo1" }];
  profilesCreated = 0;

  User.findOne = async () => user;
  User.findById = async () => user;
  User.create = async (data) => (user = { _id: "demo1", ...data });
  User.updateOne = async (_q, { $set }) => { Object.assign(user, $set); };
  User.findByIdAndDelete = async () => { user = null; };
  Profile.findOneAndDelete = async (q) => {
    if (!profile || profile.createdAt >= q.createdAt.$lt) return null;
    const old = profile; profile = null; return old;
  };
  Profile.exists = async () => (profile ? { _id: "p1" } : null);
  Profile.create = async (data) => { profilesCreated += 1; profile = { ...data, createdAt: new Date() }; return profile; };
  JobApplication.deleteMany = async () => { jobs = []; };
  JobApplication.insertMany = async (docs) => { jobs.push(...docs); };
  InterviewSession.deleteMany = async () => { interviews = []; };
});

test("a demo opened within a day keeps its data", async () => {
  await getFreshDemoUser();
  assert.equal(profilesCreated, 0);
  assert.deepEqual(jobs, [{ user: "demo1", company: "Junk Inc" }]);
});

test("demo data older than a day is put back to the sample", async () => {
  profile.createdAt = new Date(Date.now() - 2 * DAY);
  const result = await getFreshDemoUser();
  assert.equal(profilesCreated, 1);
  assert.equal(profile.careerGoal, "Seeking a Backend/Cloud Software Engineer role at a product-focused team.");
  assert.ok(!jobs.some((j) => j.company === "Junk Inc"), "visitor-added jobs are gone");
  assert.equal(jobs.length, 4);
  assert.equal(interviews.length, 0);
  assert.equal(result.name, "Alex Rivera", "account settings are reset too");
});

test("a demo whose profile was deleted is re-seeded", async () => {
  profile = null;
  await getFreshDemoUser();
  assert.equal(profilesCreated, 1);
});

test("the demo account is created on first use", async () => {
  User.findOne = async () => null;
  profile = null;
  jobs = [];
  const result = await getFreshDemoUser();
  assert.equal(result.email, DEMO_EMAIL);
  assert.equal(profilesCreated, 1);
  assert.equal(jobs.length, 4);
});
