<div align="center">
  
  # 🚀 CareerOS AI
  **AI-Powered Portfolio & Mock Prep Suite**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Backend-green?logo=node.js)](https://nodejs.org/)

</div>

<br/>

**CareerOS AI** is a production-ready, full-stack career development assistant designed for college students and job seekers. The platform aggregates student profiles (skills, projects, education), automates resume keyword parsing, reviews files against job descriptions (ATS scanning), connects to active vacancy portals, and conducts dynamic mock interviews (Open-ended or MCQ format) using the **Google Gemini API**.

---

## 🛠️ Technology Stack & Architecture

*   **Frontend Client**: React / Next.js 15, Tailwind CSS, Lucide icons, and Recharts/SVG vector dashboards.
*   **Backend Server**: Node.js, Express, Multer (file middleware), and Mongoose (ODM).
*   **Database**: MongoDB Atlas (Free M0 document cluster).
*   **File Storage**: Cloudinary Free Tier (PDF resume host).
*   **External Feeds**: GitHub REST API (code summaries) & Adzuna API (live vacancies).
*   **AI Engine**: Google AI Studio Gemini API (`gemini-2.0-flash`).

### 📊 Data Flow Diagram

```
[ Next.js 15 Client ] <==== (JSON / REST APIs) ====> [ Express Backend ]
                                                            ||
     =======================================================||=======================
     ||                     ||                     ||                      ||
[ MongoDB Atlas ]     [ Cloudinary ]        [ Gemini API ]          [ Adzuna / GitHub APIs ]
  (Profile/Jobs)       (PDF Storage)         (Evaluations)             (External Feeds)
```

---

## 🔑 Core Features & Modules

### 🧑‍💻 1. Unified Dashboard & Profiler
*   **Career Score**: Computes a career readiness score (0-100) using a strict weighting: **50% Profile Tech Skills/Projects** and **50% GitHub Activity Score**.
*   **AI Recommendations**: Computes bulleted strengths and suggestions on how to improve coding structures.
*   **Onboarding cards**: Direct form updates for education, projects, repositories, and target goals.

### 📄 2. Automated Resume & ATS Suite
*   **PDF Extractor**: Upload a resume PDF. The backend extracts text using `pdf-parse` and updates profile skills via Gemini automatically—zero client-side extraction required.
*   **ATS Checker**: Paste a target Job Description. The system matches it against profile data to output an ATS compatibility score, identify missing keywords, highlight formatting issues, and suggest revisions.
*   **Resume Exporter**: A button that reads profile metadata and exports a clean, single-page professional PDF resume using a client-side layout.

### 🎤 3. Customizable Mock Interviews
*   **Length Options**: Set tests to **5, 10, or 20 questions**.
*   **Format Selection**:
    *   *Written Mode*: Open-ended technical/HR questions where users type responses, evaluated by Gemini.
    *   *MCQ Mode*: Multiple choice questions evaluated programmatically (saving rate limits and providing instant scorecards).

### 📋 4. Kanban Job Tracker & Adzuna Live Search
*   **Job Finder**: Fetch live, active job listings matching career goals using the Adzuna API.
*   **AI Match Check**: Click any tracked card, paste a job description, and get a match score and missing keyword gaps.
*   **HTML5 Kanban Pipeline**: Drag cards between columns (Wishlist ➔ Applied ➔ Interviewing ➔ Offer ➔ Rejected).

### 🤖 5. Context-Aware AI Copilot Chat
*   A persistent sidebar helper that answers questions using the candidate's parsed database metrics (roadmap steps, applications list, strengths) to keep chat sessions actionable.

### ✉️ 6. Outreach AI (Networking Assistant)
*   **Smart Drafting:** Automatically drafts highly personalized LinkedIn connection requests or Cold Emails.
*   **Context Aware:** Injects the user's career summary, target role, and target company to write messages that sound authentic and professional, avoiding generic AI spam.

### 🌐 7. Public Portfolio
*   **Live Shareable Link:** Users get a dedicated public route (`/p/[username]`) to share their profile with recruiters.
*   **GitHub Integration:** Embeds their live GitHub activity chart directly into the portfolio.

---

## 🚀 Installation & Setup

### 📌 Prerequisites
Make sure you have Node.js (v18+) and npm installed.

### ⚙️ Backend Setup (`/careeros`)
1. Navigate to the backend directory:
   ```bash
   cd careeros
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your developer keys:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_uri
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   GITHUB_TOKEN=your_github_token
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ADZUNA_APP_ID=your_adzuna_app_id
   ADZUNA_API_KEY=your_adzuna_api_key
   ```
4. Start the backend developer server:
   ```bash
   npm run dev
   ```

### 🖥️ Frontend Setup (`/frontend`)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development client:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🔒 Quota Guardrails & Caching Layer

To protect the Google AI Studio free tier limits, CareerOS AI utilizes a multi-layered guardrail:
1.  **In-Memory Rate Limiting**: Enforces a per-minute token bucket rate limiter (max 10 calls/min) to prevent rapid user spam from consuming quotas.
2.  **Daily Quota Log (`UsageLog` Collection)**: Blocks outgoing calls once the daily limit (default 1400 calls) is reached, serving cached fallback data instead.
3.  **Mongoose Schema Cache TTL**: Calculates GitHub Analysis and Career Scores once and caches them for **24 hours** (`GEMINI_CACHE_TTL_HOURS`). Subsequent page visits load instantly from MongoDB.
4.  **Programmatic MCQ Grader**: Evaluating MCQ choices is done programmatically on the backend server, saving expensive LLM inferences.

---

## 📸 Screenshots
*(Add screenshots or a GIF of your dashboard and interview workflow here)*

---

## 🤝 Contributing
Contributions are always welcome! Feel free to open a pull request or file an issue if you encounter bugs or have feature requests.

---

## 📜 License
This project is licensed under the [MIT License](LICENSE).
