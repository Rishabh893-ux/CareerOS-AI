const JobApplication = require("../models/JobApplication");
const Profile = require("../models/Profile");
const { analyzeAts } = require("./atsAnalyzer");
const { extractJobKeywords, resumeTextFor } = require("./jobKeywords");

/**
 * Scores how well the person's resume covers a job's keywords. Uses the same
 * verified matching as the ATS check: the AI only lists what the job asks for,
 * and every "missing" skill is checked against the full resume text.
 */
async function analyzeJobMatch(jobId, userId) {
  const job = await JobApplication.findOne({ _id: jobId, user: userId });
  if (!job?.jobDescription) return;

  try {
    const profile = await Profile.findOne({ user: userId });
    const resumeText = profile ? resumeTextFor(profile) : "";
    if (resumeText.length < 30) {
      job.matchStatus = "failed";
      job.matchError = "Add your resume or fill in your profile first, then re-run the match.";
      await job.save();
      return;
    }

    const keywordList = await extractJobKeywords(job.jobDescription, "job_match_advanced");
    const { keywords, breakdown } = analyzeAts(resumeText, keywordList);
    const all = [...keywords.required, ...keywords.preferred];

    if (all.length === 0) {
      // Job-board search results only carry a ~500-character preview ending in "…"
      const isPreview = job.jobDescription.length <= 600 && /(…|\.\.\.)\s*$/.test(job.jobDescription);
      job.matchStatus = "failed";
      job.matchError = isPreview
        ? "Search results only include a preview of the posting. Open the posting, paste the full description here, and save."
        : "Couldn't find any skills in this job description. Paste the full posting and re-run.";
      await job.save();
      return;
    }

    const missingRequired = keywords.required.filter((k) => !k.found).map((k) => k.term);
    const missingPreferred = keywords.preferred.filter((k) => !k.found).map((k) => k.term);
    const tips = [];
    if (missingRequired.length) {
      tips.push(`Required skills your resume doesn't mention: ${missingRequired.join(", ")}. If you've used any, name them in your resume before applying.`);
    }
    if (missingPreferred.length) tips.push(`Nice-to-haves you could highlight if they apply: ${missingPreferred.join(", ")}.`);
    if (!missingRequired.length) tips.push("You cover every required skill. Lead your application with the project that uses the most of them.");

    job.matchPercentage = breakdown.keywords;
    job.matchedSkills = all.filter((k) => k.found).map((k) => k.term);
    job.missingSkills = [...missingRequired, ...missingPreferred];
    job.tips = tips;
    // Superseded by matchedSkills/missingSkills; cleared so old AI prose doesn't linger
    job.strengths = [];
    job.weaknesses = [];
    job.keywordSource = keywordList.source;
    job.matchError = undefined;
    job.matchedAt = new Date();
    job.matchStatus = "completed";
    await job.save();
  } catch (err) {
    console.error(`[JobMatchService] Match failed for job ${jobId}:`, err.message);
    await JobApplication.updateOne(
      { _id: jobId, user: userId },
      { $set: { matchStatus: "failed", matchError: "The match couldn't be completed. Try again in a moment." } }
    ).catch(() => {});
  }
}

module.exports = { analyzeJobMatch };
