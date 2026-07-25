const JobApplication = require("../models/JobApplication");
const Profile = require("../models/Profile");
const { callGemini } = require("./geminiService");

async function analyzeJobMatch(jobId, userId) {
  try {
    console.log(`[JobMatchService] Starting background match analysis for Job ${jobId}`);

    const job = await JobApplication.findOne({ _id: jobId, user: userId });
    if (!job || !job.jobDescription) {
      console.error(`[JobMatchService] Job ${jobId} not found or missing description.`);
      return;
    }

    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
       console.error(`[JobMatchService] Profile for user ${userId} not found.`);
       job.matchStatus = "failed";
       await job.save();
       return;
    }

    const userSkills = [...new Set([...(profile.skills || []), ...(profile.resumeExtractedSkills || [])])];
    
    // Format experience to strings
    const experienceData = (profile.experience || []).map(exp => 
      `${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate}): ${exp.description}`
    ).join("\n\n");

    // Format projects to strings
    const projectData = (profile.projects || []).map(proj => 
      `${proj.title} (Tech: ${proj.techStack?.join(", ") || "N/A"}): ${proj.description}`
    ).join("\n\n");

    const prompt = `Analyze this candidate's fit for the provided job description based on their full profile.

    Candidate Skills: ${JSON.stringify(userSkills)}
    Candidate Experience: 
    ${experienceData || "No formal experience listed."}
    
    Candidate Projects:
    ${projectData || "No projects listed."}
    
    Job description: """${job.jobDescription.slice(0, 4000)}"""
    
    Provide a detailed and honest evaluation.
    Return ONLY valid JSON matching this structure exactly: 
    { 
      "matchPercentage": <Number between 0-100>, 
      "missingSkills": ["...", "..."],
      "strengths": ["...", "..."],
      "weaknesses": ["...", "..."],
      "tips": ["...", "..."]
    }`;

    const result = await callGemini("job_match_advanced", prompt, { jsonSchemaHint: true });
    
    if (!result.success) {
      console.error(`[JobMatchService] Gemini returned error for Job ${jobId}: ${result.error}`);
      job.matchStatus = "failed";
      await job.save();
      return;
    }

    job.matchPercentage = result.data.matchPercentage;
    job.missingSkills = result.data.missingSkills || [];
    job.strengths = result.data.strengths || [];
    job.weaknesses = result.data.weaknesses || [];
    job.tips = result.data.tips || [];
    job.matchStatus = "completed";
    
    await job.save();
    console.log(`[JobMatchService] Successfully completed match analysis for Job ${jobId}`);

  } catch (err) {
    console.error(`[JobMatchService] Unhandled error during match analysis for Job ${jobId}:`, err);
    try {
      await JobApplication.updateOne({ _id: jobId, user: userId }, { $set: { matchStatus: "failed" } });
    } catch (dbErr) {
       console.error(`[JobMatchService] Failed to set status to failed:`, dbErr);
    }
  }
}

module.exports = {
  analyzeJobMatch,
};
