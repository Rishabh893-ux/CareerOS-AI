// The shared demo account behind "Try the Demo": realistic sample data so a
// visitor can explore every feature without signing up. Every visitor shares
// it and can edit it, so the data is put back to this sample once it's more
// than a day old (checked each time someone opens the demo).
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Profile = require("../models/Profile");
const JobApplication = require("../models/JobApplication");
const InterviewSession = require("../models/InterviewSession");

const DEMO_EMAIL = "demo@careeros.ai";
const DEMO_USER = { name: "Alex Rivera", username: "demo", githubUsername: "octocat" };
const RESET_AFTER_MS = 24 * 60 * 60 * 1000;

function demoProfile(userId, now) {
  return {
    user: userId,
    phone: "+1 (555) 010-1234",
    location: "Remote",
    careerGoal: "Seeking a Backend/Cloud Software Engineer role at a product-focused team.",
    skills: ["JavaScript", "TypeScript", "Node.js", "React", "MongoDB", "PostgreSQL", "Docker", "AWS", "GraphQL", "System Design"],
    resumeExtractedSkills: ["Node.js", "React", "MongoDB"],
    education: [
      { institute: "State University", degree: "B.Tech", branch: "Computer Science", cgpa: 8.7, graduationYear: 2024 },
    ],
    experience: [
      {
        company: "Nimbus Cloud Systems",
        role: "Software Engineer",
        startDate: "Jul 2024",
        endDate: "Present",
        description: "- Built and shipped internal tooling used by 40+ engineers daily\n- Migrated a legacy REST service to GraphQL, cutting client round-trips by 35%\n- On-call rotation for a payments microservice handling 200k+ requests/day",
      },
      {
        company: "Brightline Labs",
        role: "Software Engineering Intern",
        startDate: "May 2023",
        endDate: "Aug 2023",
        description: "- Built a real-time notifications feature with WebSockets\n- Wrote integration tests that caught 3 production-bound regressions pre-launch",
      },
    ],
    certifications: [
      { name: "AWS Certified Developer – Associate", issuer: "Amazon Web Services", date: "2024" },
    ],
    projects: [
      {
        title: "CareerOS AI",
        description: "This app — an AI career-readiness platform with resume parsing, ATS scoring, mock interviews, and a job tracker.",
        techStack: ["Next.js", "Express", "MongoDB", "Groq"],
        repoUrl: "https://github.com/octocat/careeros-ai",
      },
      {
        title: "Pantry — Recipe Sharing API",
        description: "A REST API for a recipe-sharing app with search, ratings, and image uploads. Deployed with CI/CD on push to main.",
        techStack: ["Node.js", "PostgreSQL", "Docker"],
        repoUrl: "https://github.com/octocat/pantry-api",
      },
      {
        title: "Latency Tracker",
        description: "A small CLI that pings a list of endpoints on a schedule and alerts on latency regressions.",
        techStack: ["Go", "SQLite"],
        repoUrl: "https://github.com/octocat/latency-tracker",
      },
    ],
    careerScore: {
      score: 78,
      strengths: [
        "Solid full-stack project portfolio with real deployed work",
        "Consistent GitHub activity across multiple languages",
        "Relevant internship-to-full-time career progression",
      ],
      weaknesses: [
        "Limited large-scale distributed systems experience",
        "No public technical writing or conference talks yet",
      ],
      computedAt: now,
    },
    // Same shape the analyzer produces (services/githubScoring.js)
    githubAnalysis: {
      score: 69,
      summary: "Six original repositories spanning a TypeScript web platform, a JavaScript REST API and Go tooling. Activity is the strongest signal, with 4 repos pushed in the last 90 days. Adding live demo links and topics would do the most to strengthen the showcase.",
      topLanguages: ["TypeScript", "JavaScript", "Go"],
      signals: [
        { key: "documentation", label: "Documentation", score: 24, max: 30, detail: "5/6 recent repos have a README · 4/6 have a description" },
        { key: "activity", label: "Activity", score: 20, max: 25, detail: "4 repos pushed in the last 90 days · last push 12 days ago" },
        { key: "showcase", label: "Showcase", score: 11, max: 20, detail: "1 live demo link · 3/6 with topics · 4/6 licensed" },
        { key: "community", label: "Community", score: 8, max: 15, detail: "22 stars · 9 followers" },
        { key: "breadth", label: "Breadth", score: 6, max: 10, detail: "3 languages across 6 repos" },
      ],
      recommendations: [
        "Add live demo links to 2 more projects (About → Website).",
        "Add a README to dotfiles: what it does, how to run it, and a screenshot.",
        "Add a one-line description to dotfiles and scratchpad.",
        "Add topics (e.g. react, fastapi) to latency-tracker, dotfiles and scratchpad so they show up in skill searches.",
      ],
      metrics: {
        repoCount: 6, totalStars: 22, followers: 9, recentlyPushed: 4, daysSinceLastPush: 12,
        readmeChecked: 6, readmeCount: 5, descriptionCount: 4, demoCount: 1, topicsCount: 3, licenseCount: 4,
        hasProfileReadme: true,
        languages: [{ name: "TypeScript", share: 50 }, { name: "JavaScript", share: 33 }, { name: "Go", share: 17 }],
      },
      repos: [
        { name: "careeros-ai", description: "AI career-readiness platform", language: "TypeScript", stars: 12, html_url: "https://github.com/octocat/careeros-ai", hasReadme: true },
        { name: "pantry-api", description: "Recipe sharing REST API", language: "JavaScript", stars: 4, html_url: "https://github.com/octocat/pantry-api", hasReadme: true },
        { name: "latency-tracker", description: "Endpoint latency alerting CLI", language: "Go", stars: 2, html_url: "https://github.com/octocat/latency-tracker", hasReadme: true },
        { name: "design-tokens", description: "Shared color and type tokens for web apps", language: "TypeScript", stars: 3, html_url: "https://github.com/octocat/design-tokens", hasReadme: true },
        { name: "scratchpad", description: "", language: "TypeScript", stars: 1, html_url: "https://github.com/octocat/scratchpad", hasReadme: true },
        { name: "dotfiles", description: "", language: "JavaScript", stars: 0, html_url: "https://github.com/octocat/dotfiles", hasReadme: false },
      ],
      computedAt: now,
    },
    careerPath: {
      targetRole: "Backend/Cloud Software Engineer",
      ladder: [
        { title: "Software Engineer", yearsRange: "0–2 years", description: "Ship well-scoped features and own services end to end with review." },
        { title: "Senior Software Engineer", yearsRange: "3–5 years", description: "Design services, lead projects across a team, mentor juniors." },
        { title: "Staff Engineer", yearsRange: "6–9 years", description: "Set technical direction across teams and own platform-level decisions." },
      ],
      computedAt: now,
    },
    skillGap: {
      targetRole: "Backend/Cloud Software Engineer",
      missingSkills: ["Kubernetes", "Terraform", "Kafka", "gRPC"],
      computedAt: now,
    },
    roadmap: {
      targetRole: "Backend/Cloud Software Engineer",
      steps: [
        { title: "Learn Kubernetes fundamentals", description: "Deploy an existing project to a local k8s cluster (kind/minikube).", resourceHint: "Kubernetes official docs + a hands-on course" },
        { title: "Get hands-on with Terraform", description: "Recreate your current AWS setup as Infrastructure-as-Code.", resourceHint: "HashiCorp Terraform tutorials" },
        { title: "Understand event-driven architecture", description: "Build a small producer/consumer service using Kafka or a managed equivalent.", resourceHint: "Kafka official quickstart" },
      ],
      computedAt: now,
    },
  };
}

function demoJobs(userId, now) {
  // A few applications across the board, so the Job Tracker isn't empty
  const daysAgo = (d) => new Date(now.getTime() - d * 86_400_000);
  return [
    {
      user: userId, company: "Northwind Payments", role: "Backend Engineer", status: "Interviewing",
      jobUrl: "https://example.com/careers/northwind-backend", appliedOn: daysAgo(18),
      notes: "Recruiter screen went well. System design round on Friday.",
      jobDescription: "Backend Engineer to build payment APIs in Node.js and TypeScript on AWS, with PostgreSQL, Docker and Kubernetes. Nice to have: Kafka, GraphQL.",
      matchStatus: "completed", matchPercentage: 73, keywordSource: "ai", matchedAt: daysAgo(18),
      matchedSkills: ["Node.js", "TypeScript", "AWS", "PostgreSQL", "Docker", "GraphQL"], missingSkills: ["Kubernetes", "Kafka"],
      tips: ["Required skills your resume doesn't mention: Kubernetes. If you've used any, name them in your resume before applying.", "Nice-to-haves you could highlight if they apply: Kafka."],
    },
    {
      user: userId, company: "Helios Cloud", role: "Platform Engineer", status: "Applied",
      jobUrl: "https://example.com/careers/helios-platform", appliedOn: daysAgo(6),
      jobDescription: "Platform Engineer working on Terraform, Kubernetes and AWS infrastructure, CI/CD with GitHub Actions, and Go tooling. Nice to have: Prometheus, Grafana.",
      matchStatus: "completed", matchPercentage: 45, keywordSource: "ai", matchedAt: daysAgo(6),
      matchedSkills: ["AWS", "Go", "Docker"], missingSkills: ["Terraform", "Kubernetes", "GitHub Actions", "Prometheus", "Grafana"],
      tips: ["Required skills your resume doesn't mention: Terraform, Kubernetes, GitHub Actions. If you've used any, name them in your resume before applying.", "Nice-to-haves you could highlight if they apply: Prometheus, Grafana."],
    },
    {
      user: userId, company: "Lattice Labs", role: "Software Engineer II", status: "Wishlist",
      jobUrl: "https://example.com/careers/lattice-swe2",
    },
    {
      user: userId, company: "Quill Analytics", role: "Full Stack Developer", status: "Rejected",
      jobUrl: "https://example.com/careers/quill-fullstack", appliedOn: daysAgo(30),
      notes: "Rejected after take-home. Feedback: add more tests.",
    },
  ];
}

async function seedDemoData(userId) {
  const now = new Date();
  await Profile.create(demoProfile(userId, now));
  await JobApplication.insertMany(demoJobs(userId, now));
}

/** Returns the demo user, creating it, or resetting its data if stale or missing. */
async function getFreshDemoUser() {
  let user = await User.findOne({ email: DEMO_EMAIL });

  if (!user) {
    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
    user = await User.create({ ...DEMO_USER, email: DEMO_EMAIL, passwordHash });
    try {
      await seedDemoData(user._id);
    } catch (err) {
      await Promise.all([User.findByIdAndDelete(user._id), JobApplication.deleteMany({ user: user._id })]);
      throw err;
    }
    return user;
  }

  // findOneAndDelete is atomic, so when several visitors arrive at once only
  // one of them gets the stale profile back and does the reset.
  const stale = await Profile.findOneAndDelete({ user: user._id, createdAt: { $lt: new Date(Date.now() - RESET_AFTER_MS) } });
  const missing = !stale && !(await Profile.exists({ user: user._id }));
  if (stale || missing) {
    await Promise.all([
      JobApplication.deleteMany({ user: user._id }),
      InterviewSession.deleteMany({ user: user._id }),
      User.updateOne({ _id: user._id }, { $set: DEMO_USER, $unset: { linkedinUrl: "" } }),
    ]);
    try {
      await seedDemoData(user._id);
    } catch (err) {
      // Duplicate key on the profile: another visitor re-seeded it a moment ago
      if (err.code !== 11000) throw err;
    }
    user = await User.findById(user._id);
  }
  return user;
}

module.exports = { DEMO_EMAIL, getFreshDemoUser };
