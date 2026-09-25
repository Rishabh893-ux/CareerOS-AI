const { test } = require("node:test");
const assert = require("node:assert/strict");
const { analyzeAts, fallbackKeywords, containsTerm, normalize } = require("../services/atsAnalyzer");

const has = (text, term) => containsTerm(normalize(text), term, text);

const RESUME = `Ada Lovelace
ada@example.com · +91 98765 43210 · linkedin.com/in/ada · github.com/ada

Summary
Full-stack developer targeting backend roles.

Experience
Software Intern, Acme
• Built REST APIs in Node.js and PostgreSQL serving 20k users
• Reduced page load time by 40% by adding Redis caching
• Automated deployments with Docker and GitHub Actions, cutting release time from 2 hours to 15 minutes
• Worked on the dashboard

Projects
CareerOS: React, TypeScript, MongoDB

Education
B.Tech Computer Science, 2026

Skills
JavaScript, TypeScript, React, Node.js, PostgreSQL, Docker, Git
`.repeat(1) + " filler".repeat(300);

test("matches aliases and punctuation-heavy skill names", () => {
  assert.equal(has("Built with Node and React.js", "node.js"), true);
  assert.equal(has("Built with Node and React.js", "React"), true);
  assert.equal(has("Deployed on k8s", "Kubernetes"), true);
  assert.equal(has("Strong C++ and C# skills", "c++"), true);
  assert.equal(has("Strong C++ and C# skills", "c#"), true);
  assert.equal(has("Designed RESTful APIs", "REST API"), true);
});

test("everyday words don't count as skills", () => {
  assert.equal(has("Next steps: go live with the rest of the team", "Next.js"), false);
  assert.equal(has("Next steps: go live with the rest of the team", "Go"), false);
  assert.equal(has("Next steps: go live with the rest of the team", "REST API"), false);
  assert.equal(has("Skilled in C++ and C#", "C"), false);
  assert.equal(has("Firmware written in C and Go", "C"), true);
  assert.equal(has("Firmware written in C and Go", "Go"), true);
});

test("keywords are matched against the whole resume, not a truncated slice", () => {
  const long = "Experience\n" + "• Built things\n".repeat(400) + "Skills\nKubernetes";
  const r = analyzeAts(long, { role: "SRE", required: ["Kubernetes"], preferred: [] });
  assert.deepEqual(r.keywords.required, [{ term: "Kubernetes", found: true }]);
});

test("match score weights required keywords double and blends in format", () => {
  const r = analyzeAts(RESUME, { role: "Backend Engineer", required: ["Node.js", "PostgreSQL", "Kafka"], preferred: ["Redis", "Go"] });
  // required: 2 of 3 found (x2) + preferred: 1 of 2 = 5 of 8 = 63%
  assert.equal(r.breakdown.keywords, 63);
  assert.equal(r.mode, "match");
  assert.equal(r.score, Math.round(0.7 * 63 + 0.3 * r.breakdown.format));
  assert.deepEqual(r.missingKeywords, ["Kafka", "Go"]);
  assert.match(r.suggestions[0], /Kafka/);
});

test("without a job description it's a format-only health check", () => {
  const r = analyzeAts(RESUME, null);
  assert.equal(r.mode, "health");
  assert.equal(r.keywords, null);
  assert.equal(r.score, r.breakdown.format);
});

test("format checks read contact details, sections, numbers and verbs", () => {
  const { checks } = analyzeAts(RESUME, null);
  const byKey = Object.fromEntries(checks.map((c) => [c.key, c]));
  for (const key of ["email", "phone", "links", "experience", "education", "skills", "summary", "quantified"]) {
    assert.equal(byKey[key].pass, true, key);
  }
  assert.match(byKey.quantified.detail, /^3 bullets/);
  assert.match(byKey.verbs.detail, /^4 of 4 bullets/); // "Worked" counts: capitalized past tense
});

test("a bare resume fails the checks and gets concrete fixes", () => {
  const r = analyzeAts("Ada Lovelace\nI like computers and want a job.", null);
  assert.ok(r.score < 30);
  assert.ok(r.suggestions.some((s) => s.includes("Experience or Projects section")));
  assert.ok(r.suggestions.some((s) => s.includes("email and phone")));
});

test("fallback keyword extraction finds known skills in the JD", () => {
  const { required } = fallbackKeywords("We need React, TypeScript and AWS experience. Docker is a plus. You will go far.");
  assert.deepEqual(required.sort(), ["aws", "docker", "react", "typescript"]);
});

test("skill-category bullets aren't judged as achievements", () => {
  const text = "SKILLS • Cloud: AWS, GCP and Azure • Scripting: Python, Bash EXPERIENCE • Investigated production outages across 3 services • Completed training";
  const byKey = Object.fromEntries(analyzeAts(text, null).checks.map((c) => [c.key, c]));
  assert.equal(byKey.verbs.detail, "2 of 2 bullets");
  assert.equal(byKey.quantified.detail, "1 bullet with numbers (aim for at least 3)");
  assert.equal(byKey.skills.pass, true);
  assert.equal(byKey.experience.pass, true);
});
