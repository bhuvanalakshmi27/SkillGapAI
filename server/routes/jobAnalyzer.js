const express = require("express");

const JobAnalysis = require("../models/JobAnalysis");
const User = require("../models/User");
const SkillGap = require("../models/SkillGap");
const SkillConfidence = require("../models/SkillConfidence");
const ProjectEvidence = require("../models/ProjectEvidence");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const authMiddleware = require("../middleware/auth");
const { enrichJobAnalysis } = require("../services/aiService");
const { findBestSkillScore } = require("../utils/skillNormalize");
const { recordProgressEvent } = require("../services/progressService");

const router = express.Router();

router.use(authMiddleware);

function extractSkillsFromText(text) {
  const known = [
    "javascript",
    "typescript",
    "react",
    "node",
    "python",
    "java",
    "sql",
    "mongodb",
    "aws",
    "docker",
    "kubernetes",
    "git",
    "html",
    "css",
    "express",
    "rest",
    "api",
    "agile",
    "communication",
  ];

  const lower = text.toLowerCase();
  return known.filter((skill) => lower.includes(skill));
}

function computeAlignment(requiredSkills, confidenceMap) {
  if (!requiredSkills.length) return { score: null, label: "Insufficient job skill data" };

  let matched = 0;
  requiredSkills.forEach((skill) => {
    const score = findBestSkillScore(skill, confidenceMap);
    if (score !== null && score >= 60) matched += 1;
  });

  const ratio = matched / requiredSkills.length;
  const score = Math.round(ratio * 100);
  let label = "Preparation needed";

  if (score >= 75) label = "Strong current profile alignment";
  else if (score >= 50) label = "Moderate current profile alignment";

  return { score, label };
}

router.get("/history", async (req, res) => {
  try {
    const history = await JobAnalysis.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch job analysis history", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const record = await JobAnalysis.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!record) return res.status(404).json({ message: "Job analysis not found" });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch job analysis", error: error.message });
  }
});

router.post("/analyze", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { jobDescription, jobTitle } = req.body;

    if (!jobDescription?.trim()) {
      return res.status(400).json({ message: "Paste a job description to analyze." });
    }

    const user = await User.findById(userId).lean();
    const [gap, confidences, projects, latestResume] = await Promise.all([
      SkillGap.findOne({ userId }).lean(),
      SkillConfidence.find({ userId }).lean(),
      ProjectEvidence.find({ userId }).lean(),
      ResumeAnalysis.findOne({ userId }).sort({ createdAt: -1 }).lean(),
    ]);

    const confidenceMap = new Map(
      confidences.map((entry) => [entry.skillName, entry.confidenceScore])
    );

    const context = {
      targetRole: user?.targetRole || "",
      jobDescription: jobDescription.trim(),
      jobTitle: jobTitle || "",
      skillConfidence: confidences.map((entry) => ({
        skillName: entry.skillName,
        confidenceScore: entry.confidenceScore,
      })),
      skillGaps: (gap?.skills || []).filter((skill) => skill.status === "Gap"),
      projects: projects.map((project) => ({
        name: project.projectName,
        skills: project.skillsDemonstrated,
        status: project.status,
      })),
      resumeKeywords: latestResume?.keywords || [],
    };

    let parsed = {
      jobTitle: jobTitle || "",
      requiredSkills: extractSkillsFromText(jobDescription),
      preferredSkills: [],
      experienceRequirements: [],
      importantKeywords: extractSkillsFromText(jobDescription),
      matchingSkills: [],
      missingSkills: [],
      priorityGaps: [],
      usefulResumeKeywords: [],
      recommendedPreparation: [],
    };

    try {
      const ai = await enrichJobAnalysis(context);
      parsed = { ...parsed, ...ai };
    } catch {
      parsed.recommendedPreparation = [
        "Close high-priority skill gaps from your latest analysis.",
        "Add missing keywords to your resume where you have supporting evidence.",
        "Build one project that demonstrates a missing required skill.",
      ];
    }

    const requiredSkills = parsed.requiredSkills || [];
    const matchingSkills = requiredSkills.filter((skill) => {
      const score = findBestSkillScore(skill, confidenceMap);
      return score !== null && score >= 60;
    });
    const missingSkills = requiredSkills.filter((skill) => !matchingSkills.includes(skill));
    const demonstratedProjectSkills = [...new Set(
      projects
        .filter((project) => project.status === "completed")
        .flatMap((project) => project.skillsDemonstrated || [])
        .filter((skill) => requiredSkills.some((required) => required.toLowerCase() === skill.toLowerCase()))
    )];
    const priorityGaps = (gap?.skills || [])
      .filter((skill) => missingSkills.some((missing) => missing.toLowerCase() === skill.skillName.toLowerCase()))
      .map((skill) => skill.skillName);

    const alignment = computeAlignment(requiredSkills, confidenceMap);

    const record = await JobAnalysis.create({
      userId,
      jobTitle: parsed.jobTitle || jobTitle || "Job posting",
      sourceTextPreview: jobDescription.trim().slice(0, 1200),
      requiredSkills,
      preferredSkills: parsed.preferredSkills || [],
      experienceRequirements: parsed.experienceRequirements || [],
      importantKeywords: parsed.importantKeywords || [],
      matchingSkills,
      missingSkills,
      priorityGaps,
      demonstratedProjectSkills,
      usefulResumeKeywords: parsed.usefulResumeKeywords || missingSkills.slice(0, 8),
      recommendedPreparation: parsed.recommendedPreparation || [],
      profileAlignmentScore: alignment.score,
      profileAlignmentLabel: alignment.label,
      targetRoleAtAnalysis: user?.targetRole || "",
    });

    await recordProgressEvent(userId, "job_analysis", "Analyzed job description match", {
      analysisId: record._id,
      alignmentScore: alignment.score,
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: "Job analysis failed", error: error.message });
  }
});

module.exports = router;
