# CareerOS AI — Backend

Express + MongoDB API powering [CareerOS AI](../README.md): auth, profile management, resume parsing & ATS scoring, GitHub analysis, career scoring, skill-gap/roadmap generation, mock interviews, job tracking with live search, outreach message drafting, and a context-aware AI copilot.

## API Modules

| Module | Base path | What it does |
|---|---|---|
| Auth | `/api/auth` | Register/login (JWT), password reset, account settings (username, GitHub/LinkedIn links) |
| Profile | `/api/profile` | CRUD for education, projects, skills, career goal; public portfolio lookup (`/public/:username`) |
| Resume | `/api/resume` | Upload + parse (PDF/image, three-tier extraction — see below), ATS check against a job description, bullet enhancement, PDF export data |
| GitHub | `/api/github` | Fetches and AI-summarizes a linked GitHub profile's activity and repos |
| Career | `/api/career` | Computes the 0–100 career readiness score |
| Growth | `/api/growth` | `POST /skill-gap` and `POST /roadmap` for a target role, cached 24h per role |
| Interview | `/api/interview` | Generates HR/Technical mock interviews (written or MCQ), scores answers, keeps a session journal |
| Jobs | `/api/jobs` | Kanban job tracker (CRUD) + live search via Adzuna + AI job-match scoring |
| Outreach | `/api/outreach` | Drafts personalized cold emails / LinkedIn messages from profile data |
| Copilot | `/api/copilot` | Chat assistant that answers from the user's own cached data, never triggers fresh AI analysis itself |
| Usage | `/api/usage` | Daily AI call quota status |

## Setup

```bash
npm install
cp .env.example .env   # fill in your own keys
npm run dev
```

Required accounts (all have usable free tiers):
- MongoDB Atlas (free M0 cluster)
- [Groq Console](https://console.groq.com/keys) → API key
- GitHub personal access token (no special scopes needed for public repo reads)
- Cloudinary (resume file storage)
- Adzuna (optional — falls back to mock listings if unset)

## Resume text extraction

`POST /api/resume/upload` runs entirely server-side, in three tiers, so both native-text and scanned resumes work:
1. **`pdf-parse`** — fast path for PDFs with a real text layer.
2. **`pdfjs-dist`'s own text layer API** — recovers text from PDFs that trip up `pdf-parse` (unusual encodings, malformed xrefs), without touching any rendering code.
3. **Rasterize + Groq Vision OCR** — only for genuinely scanned/image-only PDFs: pages are rendered to images (`pdfjs-dist` + `@napi-rs/canvas`) and OCR'd.

Image uploads (JPG/PNG) go straight through Groq Vision. Only one `pdfjs-dist` version is ever loaded in the process — its Node "fake worker" caches on a process-wide global, so a second copy would silently produce version-mismatch crashes.

## Architecture decisions

**Why MongoDB over SQL:** Profile data is nested and varies per user (education arrays, project arrays, skill lists) — a document model avoids the join-table sprawl a relational schema would need here, and it's free-tier friendly (Atlas M0).

**Why raw files never touch Mongo:** Resume files go to Cloudinary; only the URL and the AI-extracted skill list are stored in Mongo. Keeps documents small and respects the 512MB free-tier cap.

**Why one shared `aiService.js`:** Every AI feature (resume parsing, GitHub analysis, career score, job match, copilot, outreach) goes through one function. Rate limiting, daily quota tracking, and cache fallback live there once — instead of being duplicated (and re-bugged) across ten route files.

**Career Score weighting is fixed, not model-decided:** the AI fills in the assessment within a fixed weighting (skills/projects, GitHub activity, goal alignment) — it doesn't invent the formula. Deliberate, so the score is explainable and reproducible, not a black box.

**Caching strategy:** GitHub analysis and Career Score are cached on the Profile document with a `computedAt` timestamp, recomputed only when older than `AI_CACHE_TTL_HOURS` (default 24h) or on an explicit `?refresh=true`. This is the single biggest lever against quota exhaustion — most dashboard loads serve cached data with zero AI calls.

**Quota guardrail layers, in order of effect:**
1. Daily quota check (`UsageLog` collection) — stops calls once `AI_DAILY_LIMIT` is hit, serves cached/fallback data instead of erroring.
2. Per-minute in-memory token bucket — stops one user from burning the daily quota in a spam burst.
3. Caching (above) — reduces call volume in the first place.

**AI Copilot never triggers fresh analysis itself:** it only reads cached `careerScore` / `githubAnalysis` / `skillGap` / `roadmap` from the Profile. If those are missing, it tells the user which endpoint to run first, rather than silently spending another AI call. Keeps Copilot's cost to exactly one call per message.

**Why roadmap reuses skill-gap data instead of a fresh call:** if `/growth/skill-gap` already ran for the same `targetRole`, `/growth/roadmap` passes that missing-skills list into its own prompt instead of asking the model to re-derive it — one less redundant inference per role.

## Possible next steps

- Request validation (e.g. `zod` or `express-validator`) — current routes do minimal manual checks only.
- `fetchGithubSummary` skips per-repo README checks to avoid N+1 GitHub API calls; a "hasReadme" signal is a natural follow-up.
- Automated tests (none yet, frontend or backend).
