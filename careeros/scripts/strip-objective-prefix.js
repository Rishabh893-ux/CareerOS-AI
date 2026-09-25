// One-time cleanup: the resume parser used to store career goals as
// "Objective: <goal>" (or a bare "Objective: " when none was found). Goals are
// now stored as plain text; this strips the old prefix from saved profiles.
//
// Usage (from careeros/):
//   node scripts/strip-objective-prefix.js           # dry run: report only
//   node scripts/strip-objective-prefix.js --apply   # write the changes
require("dotenv").config();
const mongoose = require("mongoose");
const Profile = require("../models/Profile");

const PREFIX = /^\s*objective\s*:\s*/i;
const FIELDS = ["careerGoal", "roadmap.targetRole", "skillGap.targetRole", "careerPath.targetRole"];

const get = (doc, path) => path.split(".").reduce((v, k) => (v == null ? v : v[k]), doc);

async function main() {
  const apply = process.argv.includes("--apply");
  await mongoose.connect(process.env.MONGO_URI);

  const query = { $or: FIELDS.map((f) => ({ [f]: { $regex: PREFIX } })) };
  const profiles = await Profile.find(query).lean();
  console.log(`${profiles.length} profile(s) with a prefixed goal${apply ? "" : " (dry run)"}`);

  for (const profile of profiles) {
    const $set = {};
    for (const field of FIELDS) {
      const value = get(profile, field);
      if (typeof value === "string" && PREFIX.test(value)) $set[field] = value.replace(PREFIX, "").trim();
    }
    console.log(`  ${profile._id}:`, Object.entries($set).map(([k, v]) => `${k} -> ${JSON.stringify(v)}`).join(", "));
    if (apply) await Profile.updateOne({ _id: profile._id }, { $set });
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
