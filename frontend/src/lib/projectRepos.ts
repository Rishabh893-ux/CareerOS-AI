/**
 * Projects (curated case studies) and GitHub repos (raw evidence) often
 * describe the same work under different names. This links each project to
 * its repo and returns the repos that aren't already shown as a project, so
 * the two sections complement each other instead of repeating.
 */

interface ProjectLike {
  title: string;
  description?: string;
  repoUrl?: string;
}

interface RepoLike {
  name: string;
  description?: string;
  html_url?: string;
}

const norm = (s = "") => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** "CareerOS AI — Career Readiness Platform" -> "careerosai" (the name before any subtitle). */
const projectKey = (title: string) => norm(title.split(/\s[—–:|-]\s|:/)[0]);

function repoMatchesProject(repo: RepoLike, project: ProjectLike): boolean {
  if (project.repoUrl && repo.html_url) {
    return norm(project.repoUrl) === norm(repo.html_url);
  }
  const key = projectKey(project.title);
  const name = norm(repo.name);
  if (key.length < 4 || name.length < 4) return false;
  if (name === key || name.includes(key) || key.includes(name)) return true;
  // The repo may use a different codename but describe the product by name,
  // e.g. repo "Bazaario-ECommerce-Platform" described as "Bazaario's Vendly".
  const words = (repo.description || "").toLowerCase().split(/[^a-z0-9]+/).map(norm);
  return key.length >= 5 && words.includes(key);
}

export function linkProjectsToRepos<P extends ProjectLike, R extends RepoLike>(
  projects: P[] = [],
  repos: R[] = [],
  githubUsername = "",
): { projects: P[]; otherRepos: R[] } {
  const used = new Set<R>();
  const linked = projects.map((project) => {
    const repo = repos.find((r) => !used.has(r) && repoMatchesProject(r, project));
    if (!repo) return project;
    used.add(repo);
    // An explicit link always wins; otherwise borrow the matched repo's URL.
    return project.repoUrl || !repo.html_url ? project : { ...project, repoUrl: repo.html_url };
  });

  // The <username>/<username> repo is a GitHub profile README, not a project.
  const profileRepo = norm(githubUsername);
  const otherRepos = repos.filter((r) => !used.has(r) && !(profileRepo && norm(r.name) === profileRepo));

  return { projects: linked, otherRepos };
}
