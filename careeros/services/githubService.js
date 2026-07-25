const fetch = require("node-fetch");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_API = "https://api.github.com";

async function ghFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status} for ${path}`);
  }
  return res.json();
}

/**
 * Pulls a lightweight summary of a user's GitHub presence -
 * NOT full repo contents, just metadata needed for scoring.
 */
async function fetchGithubSummary(username) {
  const profile = await ghFetch(`/users/${username}`);
  const repos = await ghFetch(`/users/${username}/repos?per_page=100&sort=updated`);

  const languageCounts = {};
  let totalStars = 0;

  const repoSummaries = repos
    .filter((r) => !r.fork)
    .map((r) => {
      if (r.language) {
        languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
      }
      totalStars += r.stargazers_count;
      return {
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        updatedAt: r.updated_at,
        html_url: r.html_url,
        hasReadme: null, // would require a separate call per repo; skip for MVP cost reasons
      };
    });

  const topLanguages = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lang]) => lang);

  return {
    username,
    publicRepos: profile.public_repos,
    followers: profile.followers,
    totalStars,
    topLanguages,
    repos: repoSummaries, // Now includes all 100 repos instead of capping at 20
  };
}

module.exports = { fetchGithubSummary };
