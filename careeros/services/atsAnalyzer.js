// Deterministic ATS analysis. Keywords come from the job description (the AI
// extracts them in routes/resume.js, or FALLBACK_TERMS below when it can't);
// matching them against the resume and the format checks happen here, so every
// "missing" keyword is verifiably absent from the full resume text.

// Common spellings that mean the same skill. Keys and values are normalized.
const ALIASES = {
  js: "javascript", "node": "node.js", nodejs: "node.js", "react.js": "react", reactjs: "react",
  ts: "typescript", postgres: "postgresql", k8s: "kubernetes", nextjs: "next.js",
  "vue.js": "vue", vuejs: "vue", "express.js": "express", expressjs: "express", mongo: "mongodb",
  "amazon web services": "aws", "google cloud": "gcp", "google cloud platform": "gcp",
  "ci cd": "ci/cd", cicd: "ci/cd", "machine learning": "ml", "tailwindcss": "tailwind",
  "tailwind css": "tailwind", restful: "rest api", "rest apis": "rest api", "restful api": "rest api", "restful apis": "rest api",
};

// Used only when the AI can't extract keywords: well-known skills that appear in the JD.
const FALLBACK_TERMS = [
  "javascript", "typescript", "python", "java", "c++", "c#", "golang", "rust", "ruby", "php", "kotlin", "swift", "sql",
  "react", "angular", "vue", "next.js", "node.js", "express", "django", "flask", "fastapi", "spring", ".net",
  "html", "css", "tailwind", "redux", "graphql", "rest api", "mongodb", "postgresql", "mysql", "redis", "firebase",
  "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible", "jenkins", "ci/cd", "git", "linux",
  "ml", "pytorch", "tensorflow", "pandas", "numpy", "llm", "nlp", "figma", "jest", "cypress", "microservices", "agile",
];

const ACTION_VERBS = new Set([
  "built", "developed", "designed", "led", "created", "implemented", "improved", "reduced", "increased", "launched",
  "automated", "architected", "optimized", "delivered", "managed", "shipped", "migrated", "deployed", "integrated",
  "engineered", "established", "streamlined", "scaled", "resolved", "collaborated", "mentored", "owned", "wrote",
  "refactored", "analyzed", "achieved", "spearheaded", "drove", "enhanced", "maintained", "configured", "trained",
]);

// PDF extraction often flattens a resume onto one line, so headings can also
// appear mid-text. Mid-line they only count in capitals ("EXPERIENCE"), so the
// word "experience" in a sentence isn't mistaken for a heading.
const INLINE_HEADINGS = {
  experience: /\b(WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EXPERIENCE|EMPLOYMENT|INTERNSHIPS?|WORK HISTORY)\b/,
  projects: /\bPROJECTS\b/,
  education: /\b(EDUCATION|ACADEMICS)\b/,
  skills: /\b(SKILLS|TECHNOLOGIES|TECH STACK|CORE COMPETENCIES)\b/,
  summary: /\b(SUMMARY|PROFILE|OBJECTIVE|ABOUT ME)\b/,
};

const BULLET = /[•●▪◦]/;

const SECTION_PATTERNS = {
  experience: /^\s*(work\s+)?(experience|employment|professional experience|work history|internships?)\b/im,
  projects: /^\s*(personal\s+|academic\s+|key\s+)?projects\b/im,
  education: /^\s*(education|academics|academic background)\b/im,
  skills: /^\s*(technical\s+)?(skills|technologies|tech stack|core competencies)\b/im,
  summary: /^\s*(summary|professional summary|profile|objective|about me)\b/im,
};

/** Lowercase, collapse punctuation that doesn't carry meaning in skill names. */
function normalize(text) {
  return ` ${text.toLowerCase().replace(/[^a-z0-9+#./\s]/g, " ").replace(/\s+/g, " ")} `;
}

function canonical(term) {
  const t = normalize(term).trim();
  return ALIASES[t] || t;
}

/** Every spelling of a term that should count as a match. */
function variants(term) {
  const c = canonical(term);
  const out = new Set([c]);
  for (const [alias, target] of Object.entries(ALIASES)) if (target === c) out.add(alias);
  return [...out];
}

// Terms this short are also everyday words ("go", "R", "C"): only match them
// as written, capitalized, in the original text.
function containsShortTerm(originalText, term) {
  const escaped = term.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Za-z0-9])${escaped}(?![A-Za-z0-9+#])`).test(originalText);
}

function containsTerm(normalizedText, term, originalText = "") {
  if (/^[a-z]{1,2}$/i.test(term.trim())) return containsShortTerm(originalText, term);
  return variants(term).some((v) => {
    const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Boundaries that allow "c++", "c#", ".net" and "node.js" to match cleanly
    return new RegExp(`(^|[\\s,(/])${escaped}(?=$|[\\s,)/.;:])`).test(normalizedText);
  });
}

function fallbackKeywords(jobDescription) {
  const jd = normalize(jobDescription);
  return { role: "", required: FALLBACK_TERMS.filter((t) => containsTerm(jd, t)), preferred: [] };
}

function matchKeywords(resumeText, { required = [], preferred = [] }) {
  const text = normalize(resumeText);
  const golang = /golang/i.test(resumeText);
  const seen = new Set();
  const toItems = (terms) =>
    terms
      .map((t) => String(t).trim())
      .filter((t) => t && t.length <= 40 && !seen.has(canonical(t)) && seen.add(canonical(t)))
      .map((term) => ({ term, found: containsTerm(text, term, resumeText) || (/^go$/i.test(term) && golang) }));
  return { required: toItems(required).slice(0, 15), preferred: toItems(preferred).slice(0, 10) };
}

function runChecks(resumeText) {
  const lines = resumeText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const words = resumeText.split(/\s+/).filter(Boolean).length;
  // Bullets: split on bullet glyphs wherever they are (flattened PDF text keeps
  // them inline), plus lines that start with "-" or "*".
  const glyphBullets = BULLET.test(resumeText)
    // A bullet ends at the next bullet or a blank line, so it can't run into the next section
    ? resumeText.split(/[•●▪◦]/).slice(1).map((b) => b.split(/\n\s*\n/)[0].trim().slice(0, 300)).filter((b) => b.length > 10)
    : [];
  const dashBullets = lines.filter((l) => /^[*\-–]\s+\S/.test(l));
  const bulletLines = [...glyphBullets, ...dashBullets];
  const cleanBullet = (l) => l.replace(/^[•●▪◦*\-–]\s*/, "");
  // "Cloud: AWS, GCP" style bullets list skills; they aren't achievements, so
  // only work bullets are judged on numbers and verbs.
  const workBullets = bulletLines.filter((l) => !/^[^:]{2,45}:\s/.test(cleanBullet(l)));
  // Any number that isn't a year shows scale or impact ("10-module", "40%", "20k users")
  const quantified = workBullets.filter((l) => /\d/.test(cleanBullet(l).replace(/\b(19|20)\d{2}\b/g, "")));
  const startsWithVerb = (word = "") => ACTION_VERBS.has(word.toLowerCase()) || /^[A-Z][a-z]{2,}ed$/.test(word);
  const actionLed = workBullets.filter((l) => startsWithVerb(cleanBullet(l).split(/[\s,]+/)[0]));
  const has = (key) => SECTION_PATTERNS[key].test(resumeText) || INLINE_HEADINGS[key].test(resumeText);

  const checks = [
    { key: "email", label: "Email address", weight: 10, pass: /[\w.+-]+@[\w-]+\.[\w.]+/.test(resumeText) },
    { key: "phone", label: "Phone number", weight: 5, pass: /(\+?\d[\d\s().-]{8,}\d)/.test(resumeText) },
    { key: "links", label: "LinkedIn or GitHub link", weight: 5, pass: /(linkedin\.com|github\.com)/i.test(resumeText) },
    { key: "experience", label: "Experience or Projects section", weight: 15, pass: has("experience") || has("projects") },
    { key: "education", label: "Education section", weight: 10, pass: has("education") },
    { key: "skills", label: "Skills section", weight: 10, pass: has("skills") },
    { key: "summary", label: "Summary section", weight: 5, pass: has("summary") },
  ];

  const lengthOk = words >= 350 && words <= 1000;
  const lengthNear = words >= 200 && words <= 1400;
  checks.push({
    key: "length", label: "Length", weight: 15, pass: lengthOk, partial: !lengthOk && lengthNear,
    detail: `${words} words${lengthOk ? "" : words < 350 ? " (aim for 350–1,000: add detail to your bullets)" : " (aim for 350–1,000: tighten to one or two pages)"}`,
  });
  checks.push({
    key: "quantified", label: "Quantified results", weight: 15, pass: quantified.length >= 3, partial: quantified.length > 0 && quantified.length < 3,
    detail: `${quantified.length} bullet${quantified.length === 1 ? "" : "s"} with numbers (aim for at least 3)`,
  });
  const verbShare = workBullets.length ? actionLed.length / workBullets.length : 0;
  checks.push({
    key: "verbs", label: "Bullets start with action verbs", weight: 10, pass: workBullets.length > 0 && verbShare >= 0.5,
    partial: verbShare > 0 && verbShare < 0.5,
    detail: workBullets.length ? `${actionLed.length} of ${workBullets.length} bullets` : "No bullet points found",
  });

  const earned = checks.reduce((sum, c) => sum + (c.pass ? c.weight : c.partial ? c.weight / 2 : 0), 0);
  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  return { checks: checks.map(({ weight, ...c }) => c), formatScore: Math.round((earned / total) * 100) };
}

function suggestionsFor({ keywords, checks }) {
  const out = [];
  const missingReq = keywords ? keywords.required.filter((k) => !k.found).map((k) => k.term) : [];
  const missingPref = keywords ? keywords.preferred.filter((k) => !k.found).map((k) => k.term) : [];
  if (missingReq.length) {
    out.push(`The job asks for ${missingReq.slice(0, 5).join(", ")}${missingReq.length > 5 ? " and more" : ""}. If you have used these, name them in your skills and in the bullet where you used them. ATS filters match exact terms.`);
  }
  const failed = Object.fromEntries(checks.filter((c) => !c.pass).map((c) => [c.key, c]));
  if (failed.quantified) out.push("Add numbers to at least 3 bullets (users, % faster, time saved, team size). Quantified results stand out to both ATS ranking and recruiters.");
  if (failed.experience) out.push("Add a clearly titled Experience or Projects section. ATS parsers look for standard headings.");
  if (failed.skills) out.push("Add a Skills section that lists your tools and languages by name.");
  if (failed.education) out.push("Add an Education section with your degree, institute and graduation year.");
  if (failed.email || failed.phone) out.push("Put your email and phone number at the top, as plain text rather than in a header image or icon.");
  if (failed.verbs) out.push("Start each bullet with an action verb (Built, Reduced, Led) instead of \"Responsible for\".");
  if (failed.length) out.push(`Adjust the length: ${failed.length.detail}.`);
  if (failed.links) out.push("Add your LinkedIn or GitHub URL so reviewers can verify your work.");
  if (missingPref.length) out.push(`Nice-to-haves you could mention if they apply: ${missingPref.slice(0, 5).join(", ")}.`);
  if (failed.summary) out.push("Add a 2–3 line summary that names the role you're targeting.");
  return out.slice(0, 6);
}

/**
 * @param resumeText full plain text of the resume
 * @param keywordList { role, required, preferred } from the JD, or null when no JD was given
 */
function analyzeAts(resumeText, keywordList) {
  const { checks, formatScore } = runChecks(resumeText);
  const keywords = keywordList ? matchKeywords(resumeText, keywordList) : null;

  let keywordScore = null;
  if (keywords) {
    const req = keywords.required, pref = keywords.preferred;
    const possible = 2 * req.length + pref.length;
    const earned = 2 * req.filter((k) => k.found).length + pref.filter((k) => k.found).length;
    keywordScore = possible ? Math.round((earned / possible) * 100) : null;
  }

  // With a JD: 70% keyword coverage + 30% format. Without one: format only.
  const mode = keywordScore === null ? "health" : "match";
  const score = mode === "match" ? Math.round(0.7 * keywordScore + 0.3 * formatScore) : formatScore;

  return {
    mode,
    score,
    breakdown: { keywords: keywordScore, format: formatScore },
    role: keywordList?.role || "",
    keywords,
    missingKeywords: keywords ? [...keywords.required, ...keywords.preferred].filter((k) => !k.found).map((k) => k.term) : [],
    checks,
    suggestions: suggestionsFor({ keywords, checks }),
  };
}

module.exports = { analyzeAts, fallbackKeywords, containsTerm, normalize };
