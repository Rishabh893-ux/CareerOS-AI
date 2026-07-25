# CareerOS AI — Backend (MVP + Growth/Interview/LinkedIn)

Scope: Auth → Profile → Resume Parsing → GitHub Analyzer → Career Score → Job Tracker → AI Copilot → Skill Gap Analysis → Roadmap Generator → Interview Prep (HR/Technical + mock feedback) → LinkedIn Analyzer (manual-input based).

Market Intelligence OS, Analytics OS, and Career Workspace notes remain deferred to v2 — add once you have real usage data and know your actual Gemini quota burn.

## Endpoints added in this round

**Growth OS** (`/api/growth`)
- `POST /skill-gap` — `{ targetRole }` → missing skills, cached 24h per role
- `POST /roadmap` — `{ targetRole }` → ordered learning steps, uses skill gap data if already computed

**Interview OS** (`/api/interview`)
- `POST /generate` — `{ type: "HR"|"Technical", topic? }` → creates a session with 5 questions
- `POST /:id/feedback` — `{ answers: [...] }` → AI feedback + improvement areas, saved to session
- `GET /` — list past sessions (the interview journal)
- `DELETE /:id`

**LinkedIn OS** (`/api/linkedin`)
- `PUT /input` — user pastes their own headline/about/skills (no scraping — LinkedIn has no usable free API for this)
- `GET /analyze` — scores the pasted content, cached 24h
- `POST /generate-post` — `{ postType, context }` → drafts a post

## Setup

```bash
npm install
cp .env.example .env   # fill in your own keys
npm run dev
```

Required free-tier accounts:
- MongoDB Atlas (free M0 cluster)
- Google AI Studio → Gemini API key
- GitHub personal access token (no special scopes needed for public repo reads)
- Cloudinary free tier (resume PDF storage)

## Architecture decisions (for report / viva)

**Why MongoDB over SQL:** Profile data is nested and varies per user (education arrays, project arrays, skill lists) — document model avoids a lot of join tables a relational schema would need. Also free-tier friendly (Atlas M0).

**Why raw files never touch Mongo:** Resume PDFs go to Cloudinary; only the URL and Gemini-extracted skill list are stored in Mongo. Keeps documents small and respects the 512MB free-tier cap.

**Why one shared `geminiService.js`:** Every AI feature (resume parsing, GitHub analysis, career score, job match, copilot) goes through one function. This is where rate limiting, daily quota tracking, and cache fallback live — instead of duplicating that logic (and its bugs) in five different route files.

**Career Score weighting is fixed, not model-decided:** 40% skills/projects, 30% GitHub activity, 30% goal alignment. The model fills in the assessment within that weighting — it doesn't invent the formula. This was a deliberate choice so the score is explainable and reproducible, not a black box.

**Caching strategy:** GitHub analysis and Career Score are cached on the Profile document with a `computedAt` timestamp. They're only recomputed when the cache is older than `GEMINI_CACHE_TTL_HOURS` (default 24h) or the user explicitly passes `?refresh=true`. This is the single biggest lever against Gemini free-tier quota exhaustion — most dashboard loads serve cached data, zero AI calls.

**Quota guardrail layers (in order of effect):**
1. Daily quota check (`UsageLog` collection) — stops calls once `GEMINI_DAILY_LIMIT` is hit, serves fallback/cached data instead of erroring.
2. Per-minute in-memory token bucket — stops one user from burning the daily quota in a spam burst (e.g. hammering AI Copilot).
3. Caching (above) — reduces call volume in the first place.

**AI Copilot never triggers fresh analysis itself:** It only reads cached `careerScore` / `githubAnalysis` / `linkedinAnalysis` / `skillGap` / `roadmap` from the Profile. If those are missing, it tells the user which endpoint to call first, rather than silently spending another Gemini call. Keeps Copilot's cost per message to exactly one call.

**Why LinkedIn is manual-input, not scraped:** LinkedIn's official API doesn't expose headline/about/post data to third-party apps without partnership approval, and scraping breaks ToS and is fragile. The user pastes their own text instead — same AI scoring/rewriting value, zero scraping risk, zero broken integration when LinkedIn changes its HTML.

**Why roadmap reuses skill gap data instead of a fresh call:** If `/growth/skill-gap` was already run for the same `targetRole`, `/growth/roadmap` passes that missing-skills list into its prompt instead of asking Gemini to re-derive it — one less redundant inference per role.

## Known gaps to address before demo/submission

- Resume text extraction (PDF → text) is expected to happen client-side (e.g. with pdf.js) before calling `/resume/parse`. No server-side PDF parsing is wired up yet.
- No frontend included in this scaffold — Next.js 15 + Tailwind + Shadcn per original spec, separate build.
- `fetchGithubSummary` skips per-repo README checks to avoid N+1 GitHub API calls; "hasReadme" field is a placeholder for v2.
- Add request validation (e.g. `zod` or `express-validator`) before submission — current routes do minimal manual checks only.
