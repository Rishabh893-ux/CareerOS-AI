// Deterministic GitHub scoring. The score is built from measured signals so
// it is explainable, repeatable and actionable; the AI only writes the prose
// summary on top (see routes/github.js).

const DAY = 24 * 60 * 60 * 1000;

const clamp01 = (n) => Math.max(0, Math.min(1, n));
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const listNames = (repos, max = 3) => {
  const names = repos.slice(0, max).map((r) => r.name);
  const more = repos.length - names.length;
  const joined = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
  return more > 0 ? `${joined} (+${more} more)` : joined;
};

function computeGithubMetrics(summary, now = Date.now()) {
  const active = summary.repos.filter((r) => !r.archived);
  const readmeChecked = active.filter((r) => r.hasReadme !== null && r.hasReadme !== undefined);
  const withReadme = readmeChecked.filter((r) => r.hasReadme);
  const withDescription = active.filter((r) => r.description.trim());
  const withDemo = active.filter((r) => r.homepage.trim());
  const withTopics = active.filter((r) => r.topics.length > 0);
  const withLicense = active.filter((r) => r.hasLicense);

  const pushDays = active.map((r) => (now - new Date(r.updatedAt).getTime()) / DAY).filter(Number.isFinite);
  const recentlyPushed = pushDays.filter((d) => d <= 90).length;
  const daysSinceLastPush = pushDays.length ? Math.floor(Math.min(...pushDays)) : null;

  const langCounts = {};
  for (const r of active) if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
  const langTotal = Object.values(langCounts).reduce((a, b) => a + b, 0);
  const languages = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, share: pct(count, langTotal) }));

  return {
    repoCount: active.length,
    totalStars: active.reduce((sum, r) => sum + (r.stars || 0), 0),
    followers: summary.followers || 0,
    recentlyPushed,
    daysSinceLastPush,
    readmeChecked: readmeChecked.length,
    readmeCount: withReadme.length,
    descriptionCount: withDescription.length,
    demoCount: withDemo.length,
    topicsCount: withTopics.length,
    licenseCount: withLicense.length,
    hasProfileReadme: !!summary.hasProfileReadme,
    languages,
    // Kept for recommendations; not stored
    _missing: {
      readme: readmeChecked.filter((r) => !r.hasReadme),
      description: active.filter((r) => !r.description.trim()),
      topics: active.filter((r) => r.topics.length === 0),
      license: active.filter((r) => !r.hasLicense),
    },
  };
}

function scoreGithub(m) {
  const n = m.repoCount;
  const recency =
    m.daysSinceLastPush === null ? 0 : m.daysSinceLastPush <= 30 ? 1 : m.daysSinceLastPush <= 90 ? 0.7 : m.daysSinceLastPush <= 180 ? 0.4 : 0;

  const signals = [
    {
      key: "documentation",
      label: "Documentation",
      max: 30,
      score: Math.round(20 * clamp01(m.readmeChecked ? m.readmeCount / m.readmeChecked : 0) + 10 * clamp01(n ? m.descriptionCount / n : 0)),
      detail: `${m.readmeCount}/${m.readmeChecked} recent repos have a README · ${m.descriptionCount}/${n} have a description`,
    },
    {
      key: "activity",
      label: "Activity",
      max: 25,
      score: Math.round(15 * clamp01(m.recentlyPushed / 4) + 10 * recency),
      detail:
        m.daysSinceLastPush === null
          ? "No pushes found"
          : `${m.recentlyPushed} repo${m.recentlyPushed === 1 ? "" : "s"} pushed in the last 90 days · last push ${m.daysSinceLastPush === 0 ? "today" : `${m.daysSinceLastPush} day${m.daysSinceLastPush === 1 ? "" : "s"} ago`}`,
    },
    {
      key: "showcase",
      label: "Showcase",
      max: 20,
      score: Math.round(10 * clamp01(m.demoCount / 3) + 5 * clamp01(n ? m.topicsCount / n : 0) + 5 * clamp01(n ? m.licenseCount / n : 0)),
      detail: `${m.demoCount} live demo link${m.demoCount === 1 ? "" : "s"} · ${m.topicsCount}/${n} with topics · ${m.licenseCount}/${n} licensed`,
    },
    {
      key: "community",
      label: "Community",
      max: 15,
      // 50 stars or 20 followers earn full marks; log scale so the first stars count most
      score: Math.round(10 * clamp01(Math.log2(m.totalStars + 1) / Math.log2(51)) + 5 * clamp01(m.followers / 20)),
      detail: `${m.totalStars} star${m.totalStars === 1 ? "" : "s"} · ${m.followers} follower${m.followers === 1 ? "" : "s"}`,
    },
    {
      key: "breadth",
      label: "Breadth",
      max: 10,
      score: Math.round(10 * clamp01(m.languages.length / 5)),
      detail: `${m.languages.length} language${m.languages.length === 1 ? "" : "s"} across ${n} repo${n === 1 ? "" : "s"}`,
    },
  ];

  return { score: signals.reduce((sum, s) => sum + s.score, 0), signals };
}

/** Concrete next steps that name the repos to fix, most valuable first. */
function recommendGithub(m, username) {
  const recs = [];
  const miss = m._missing;
  if (miss.readme.length) {
    recs.push({ gain: 20 * (miss.readme.length / Math.max(m.readmeChecked, 1)),
      text: `Add a README to ${listNames(miss.readme)}: what it does, how to run it, and a screenshot.` });
  }
  if (m.demoCount < 3) {
    recs.push({ gain: 10 * (1 - m.demoCount / 3),
      text: m.demoCount === 0
        ? "Deploy a project and add its URL in the repo's About → Website field, so reviewers can try it in one click."
        : `Add live demo links to ${3 - m.demoCount} more project${3 - m.demoCount === 1 ? "" : "s"} (About → Website).` });
  }
  if (m.daysSinceLastPush !== null && m.daysSinceLastPush > 30) {
    recs.push({ gain: 10, text: `It's been ${m.daysSinceLastPush} days since your last push. Recent commits show you're actively building.` });
  }
  if (miss.description.length) {
    recs.push({ gain: 10 * (miss.description.length / Math.max(m.repoCount, 1)),
      text: `Add a one-line description to ${listNames(miss.description)}.` });
  }
  if (miss.topics.length) {
    recs.push({ gain: 5 * (miss.topics.length / Math.max(m.repoCount, 1)),
      text: `Add topics (e.g. react, fastapi) to ${listNames(miss.topics)} so they show up in skill searches.` });
  }
  if (miss.license.length) {
    recs.push({ gain: 5 * (miss.license.length / Math.max(m.repoCount, 1)),
      text: `Add a license to ${listNames(miss.license)}.` });
  }
  if (!m.hasProfileReadme) {
    recs.push({ gain: 3, text: `Create a profile README (a repo named ${username}) to introduce yourself at the top of your GitHub.` });
  }
  return recs.sort((a, b) => b.gain - a.gain).slice(0, 5).map((r) => r.text);
}

function analyzeGithub(summary, now = Date.now()) {
  const metrics = computeGithubMetrics(summary, now);
  const { score, signals } = scoreGithub(metrics);
  const recommendations = recommendGithub(metrics, summary.username);
  const { _missing, ...publicMetrics } = metrics;
  return { score, signals, recommendations, metrics: publicMetrics };
}

module.exports = { analyzeGithub };
