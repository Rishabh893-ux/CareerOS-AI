// Profile route tests. Stubs the Mongoose models, so no database is needed.
process.env.JWT_SECRET = "test-secret";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const Profile = require("../models/Profile");
const User = require("../models/User");
const profileRouter = require("../routes/profile");

const original = {
  findOneAndUpdate: Profile.findOneAndUpdate,
  profileFindOne: Profile.findOne,
  userFindOne: User.findOne,
};

let server;
let baseUrl;
const token = jwt.sign({ userId: "u1" }, process.env.JWT_SECRET);

before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/profile", profileRouter);
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/profile`;
});

after(() => {
  Profile.findOneAndUpdate = original.findOneAndUpdate;
  Profile.findOne = original.profileFindOne;
  User.findOne = original.userFindOne;
  server.close();
});

test("PUT /profile saves edited skills, including the resume-extracted list", async () => {
  let saved;
  Profile.findOneAndUpdate = async (filter, update) => {
    saved = { filter, update };
    return { user: "u1", ...update.$set };
  };

  const res = await fetch(baseUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ skills: ["React"], resumeExtractedSkills: ["React"], careerScore: { score: 100 } }),
  });

  assert.equal(res.status, 200);
  assert.deepEqual(saved.filter, { user: "u1" });
  assert.deepEqual(saved.update.$set.skills, ["React"]);
  assert.deepEqual(saved.update.$set.resumeExtractedSkills, ["React"]);
  // Computed fields are not writable through this route.
  assert.equal(saved.update.$set.careerScore, undefined);
});

test("public profile merges resume-extracted skills and hides the raw list", async () => {
  User.findOne = () => ({
    select: async () => ({ _id: "u1", name: "Ada", githubUsername: "", linkedinUrl: "" }),
  });
  Profile.findOne = () => ({
    select: async () => ({
      skills: ["React"],
      resumeExtractedSkills: ["React", "Python"],
      toObject() {
        return { skills: this.skills, resumeExtractedSkills: this.resumeExtractedSkills };
      },
    }),
  });

  const res = await fetch(`${baseUrl}/public/ada`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.profile.skills, ["React", "Python"]);
  assert.equal("resumeExtractedSkills" in body.profile, false);
});
