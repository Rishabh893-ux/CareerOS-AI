const GITHUB_API = "https://api.github.com";

// README checks cost one request per repo, so only the most recently active
// original repos are checked (well inside the 60/hour unauthenticated limit).
const README_CHECK_LIMIT = 15;
const README_CONCURRENCY = 4; // a burst of 15 parallel connections tends to time out
const REQUEST_TIMEOUT_MS = 10000;

class GithubError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function ghRequest(path, retries = 1) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "careeros-ai" };
  // The token is optional: without it GitHub still answers, at a lower rate limit.
  // Sending "token undefined" would make every request fail with 401.
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    return await fetch(`${GITHUB_API}${path}`, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    // Network-level failure (timeout, reset): retry once before giving up
    if (retries > 0) return ghRequest(path, retries - 1);
    throw new GithubError("Couldn't reach GitHub. Check your connection and try again.", 504);
  }
}

/** Runs async tasks with at most `limit` in flight, preserving order. */
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function ghFetch(path, username) {
  const res = await ghRequest(path);
  if (res.status === 404) throw new GithubError(`GitHub user "${username}" was not found. Check the username in Settings.`, 404);
  if (res.status === 403 || res.status === 429) {
    throw new GithubError("GitHub's rate limit was reached. Try again in a few minutes.", 429);
  }
  if (!res.ok) throw new GithubError(`GitHub returned an error (${res.status}). Try again shortly.`, 502);
  return res.json();
}

async function hasReadme(owner, repo) {
  try {
    const res = await ghRequest(`/repos/${owner}/${encodeURIComponent(repo)}/readme`);
    if (res.status === 404) return false;
    return res.ok ? true : null; // null = couldn't tell (e.g. rate limited)
  } catch {
    return null;
  }
}

/**
 * Pulls metadata for a user's public repos - NOT their contents - plus a
 * README check for the most recently active ones.
 */
async function fetchGithubSummary(username) {
  const name = encodeURIComponent(username);
  const [profile, repos] = await Promise.all([
    ghFetch(`/users/${name}`, username),
    ghFetch(`/users/${name}/repos?per_page=100&sort=pushed`, username),
  ]);

  const profileRepo = username.toLowerCase();
  const original = repos
    .filter((r) => !r.fork)
    // <username>/<username> is a profile README, not a project
    .filter((r) => r.name.toLowerCase() !== profileRepo);

  const checkReadme = new Set(
    original.filter((r) => !r.archived).slice(0, README_CHECK_LIMIT).map((r) => r.name)
  );
  const readmeResults = await mapLimit(original, README_CONCURRENCY, (r) =>
    checkReadme.has(r.name) ? hasReadme(profile.login, r.name) : Promise.resolve(null)
  );

  return {
    username: profile.login,
    followers: profile.followers,
    hasProfileReadme: repos.some((r) => r.name.toLowerCase() === profileRepo),
    repos: original.map((r, i) => ({
      name: r.name,
      description: r.description || "",
      language: r.language || "",
      stars: r.stargazers_count,
      updatedAt: r.pushed_at || r.updated_at,
      html_url: r.html_url,
      homepage: r.homepage || "",
      topics: r.topics || [],
      hasLicense: !!r.license,
      archived: !!r.archived,
      hasReadme: readmeResults[i],
    })),
  };
}

module.exports = { fetchGithubSummary, GithubError };
