const { test } = require("node:test");
const assert = require("node:assert/strict");
const { analyzeGithub } = require("../services/githubScoring");

const NOW = new Date("2026-09-25T00:00:00Z").getTime();
const daysAgo = (d) => new Date(NOW - d * 24 * 60 * 60 * 1000).toISOString();

const repo = (overrides) => ({
  name: "repo",
  description: "",
  language: "",
  stars: 0,
  updatedAt: daysAgo(400),
  html_url: "https://github.com/ada/repo",
  homepage: "",
  topics: [],
  hasLicense: false,
  archived: false,
  hasReadme: false,
  ...overrides,
});

test("a polished, active profile scores full marks", () => {
  const repos = ["a", "b", "c", "d", "e"].map((name, i) =>
    repo({
      name,
      description: "Does a thing",
      language: ["TypeScript", "Python", "Go", "Rust", "Java"][i],
      stars: 20,
      updatedAt: daysAgo(5),
      homepage: "https://demo.example",
      topics: ["web"],
      hasLicense: true,
      hasReadme: true,
    })
  );
  const { score, signals, recommendations } = analyzeGithub({ username: "ada", followers: 40, hasProfileReadme: true, repos }, NOW);
  assert.equal(score, 100);
  assert.deepEqual(signals.map((s) => s.score), [30, 25, 20, 15, 10]);
  assert.deepEqual(recommendations, []);
});

test("an empty profile scores zero and says what to do first", () => {
  const { score, recommendations } = analyzeGithub({ username: "ada", followers: 0, hasProfileReadme: false, repos: [] }, NOW);
  assert.equal(score, 0);
  assert.ok(recommendations.some((r) => r.includes("Deploy a project")));
});

test("the same input always produces the same score", () => {
  const input = { username: "ada", followers: 3, hasProfileReadme: false, repos: [repo({ name: "x", stars: 2, updatedAt: daysAgo(10), hasReadme: true })] };
  assert.equal(analyzeGithub(input, NOW).score, analyzeGithub(input, NOW).score);
});

test("recommendations name the repos that need work, most valuable first", () => {
  const repos = [
    repo({ name: "shop", description: "Store", hasReadme: false, updatedAt: daysAgo(3) }),
    repo({ name: "blog", description: "Blog", hasReadme: false, updatedAt: daysAgo(4) }),
    repo({ name: "cli", description: "", hasReadme: true, updatedAt: daysAgo(5), homepage: "https://x.dev" }),
  ];
  const { recommendations } = analyzeGithub({ username: "ada", followers: 0, hasProfileReadme: true, repos }, NOW);
  assert.match(recommendations[0], /README to shop and blog/);
  assert.ok(recommendations.some((r) => r.includes("description to cli")));
});

test("unchecked READMEs don't count against the documentation score", () => {
  // hasReadme: null means we couldn't check (beyond the check limit or rate limited)
  const repos = [repo({ name: "a", hasReadme: true, updatedAt: daysAgo(1) }), repo({ name: "b", hasReadme: null, updatedAt: daysAgo(1) })];
  const { signals } = analyzeGithub({ username: "ada", followers: 0, hasProfileReadme: true, repos }, NOW);
  const docs = signals.find((s) => s.key === "documentation");
  assert.match(docs.detail, /^1\/1 recent repos have a README/);
});

test("archived repos are left out of every signal", () => {
  const repos = [repo({ name: "old", archived: true, stars: 500 }), repo({ name: "new", updatedAt: daysAgo(2) })];
  const { metrics } = analyzeGithub({ username: "ada", followers: 0, hasProfileReadme: true, repos }, NOW);
  assert.equal(metrics.repoCount, 1);
  assert.equal(metrics.totalStars, 0);
});
