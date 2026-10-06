const express = require("express");

const ProjectRecommendation = require("../models/ProjectRecommendation");
const SkillGap = require("../models/SkillGap");
const SkillConfidence = require("../models/SkillConfidence");
const ProjectEvidence = require("../models/ProjectEvidence");
const Roadmap = require("../models/Roadmap");
const User = require("../models/User");
const CareerRole = require("../models/CareerRole");
const authMiddleware = require("../middleware/auth");
const {
  generateProjectRecommendations,
  getProviderErrorMessage,
} = require("../services/aiService");
const { recordProgressEvent } = require("../services/progressService");

const router = express.Router();
const activeGenerations = new Set();

router.use(authMiddleware);

router.post("/generate", async (req, res) => {
  const userId = req.user.userId;
  if (activeGenerations.has(userId)) {
    return res.status(409).json({
      message: "Recommendation generation is already in progress. Please wait for it to finish.",
      code: "AI_GENERATION_IN_PROGRESS",
    });
  }

  activeGenerations.add(userId);
  try {
    const user = await User.findById(userId).lean();

  if (!user) {
    return res.status(404).json({
      message: "Profile not found for the authenticated user. Please sign in again.",
      code: "PROFILE_NOT_FOUND",
    });
  }

  if (!user.targetRole) {
    return res.status(400).json({ message: "Set a target role before generating project recommendations." });
  }

  const [careerRole, gap, confidences, roadmap, evidence] = await Promise.all([
    CareerRole.findOne({ title: user.targetRole }).lean(),
    SkillGap.findOne({ userId }).lean(),
    SkillConfidence.find({ userId }).lean(),
    Roadmap.findOne({ userId }).lean(),
    ProjectEvidence.find({ userId }).lean(),
  ]);

  if (!careerRole) {
    return res.status(400).json({
      message: "The saved target role is no longer available. Select a valid career role in your profile.",
      code: "CAREER_ROLE_NOT_FOUND",
    });
  }

    const priorityGaps = (gap?.skills || [])
      .filter((skill) => skill.status === "Gap" || skill.status === "Not Assessed")
      .sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0))
      .slice(0, 8)
      .map((skill) => ({
        skillName: skill.skillName,
        requiredLevel: skill.requiredLevel,
        currentLevel: skill.currentLevel,
        gap: skill.gap,
        priority: skill.priority,
        status: skill.status,
      }));

    const context = {
      targetRole: user.targetRole,
      targetRoleRequirements: careerRole.skills.map((skill) => ({
        skillName: skill.name,
        requiredLevel: skill.requiredLevel,
        importance: skill.importance,
      })),
      priorityGaps,
      skillConfidence: confidences.map((entry) => ({
        skillName: entry.skillName,
        confidenceScore: entry.confidenceScore,
      })),
      roadmapSkills: (roadmap?.items || []).map((item) => item.skillName),
      existingProjects: evidence.map((project) => project.projectName),
    };

    const existingRecommendations = await ProjectRecommendation.find({
      userId,
      status: "recommended",
    }).sort({ createdAt: -1 });
    if (existingRecommendations.length) {
      return res.json(existingRecommendations);
    }

    let aiResult;
    try {
      aiResult = await generateProjectRecommendations(context);
    } catch (error) {
      if (error.code && error.code !== "AI_NOT_CONFIGURED") {
        console.error("Gemini recommendation request failed:", {
          code: error.code,
          providerMessage: error.providerMessage || error.message,
        });
      }
      if ([
        "AI_NOT_CONFIGURED",
        "AI_INVALID_KEY",
        "AI_ACCESS_DENIED",
        "AI_INVALID_REQUEST",
        "AI_MODEL_UNAVAILABLE",
        "AI_QUOTA_EXCEEDED",
        "AI_TEMPORARY_FAILURE",
        "AI_MALFORMED_RESPONSE",
      ].includes(error.code)) {
        return res.status(503).json({
          message: getProviderErrorMessage(error.code),
          code: error.code,
        });
      }
      return res.status(502).json({
        message: "The AI recommendation service did not return a usable response. Please retry.",
        code: "AI_RECOMMENDATION_FAILED",
      });
    }

    const projects = Array.isArray(aiResult?.projects) ? aiResult.projects : [];
    if (!projects.length) {
      return res.status(502).json({
        message: "The AI recommendation service returned no projects. Please retry.",
        code: "AI_RECOMMENDATION_EMPTY",
      });
    }

    const created = await ProjectRecommendation.insertMany(
      projects.slice(0, 5).map((project) => {
        const actualGapNames = new Map(priorityGaps.map((gap) => [gap.skillName.toLowerCase(), gap.skillName]));
        const relatedSkillGaps = project.relatedSkillGaps
          .map((gap) => actualGapNames.get(gap.toLowerCase()))
          .filter(Boolean);

        return {
          userId,
          title: project.title,
          description: project.description,
          difficulty: project.difficulty,
          estimatedEffortHours: project.estimatedEffortHours,
          technologies: project.technologies,
          skillsPracticed: project.skillsPracticed,
          relatedSkillGaps: relatedSkillGaps.length
            ? relatedSkillGaps
            : priorityGaps
              .filter((gap) => project.skillsPracticed.some((skill) => skill.toLowerCase() === gap.skillName.toLowerCase()))
              .map((gap) => gap.skillName),
          targetRole: context.targetRole,
          targetRoleRelationship: project.targetRoleRelationship,
          whyRecommended: project.whyRecommended,
          expectedOutcome: project.expectedOutcome,
          status: "recommended",
        };
      })
    );

    await recordProgressEvent(userId, "project_recommendation", "Generated AI project recommendations", {
      count: created.length,
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate project recommendations",
      error: error.message,
    });
  } finally {
    activeGenerations.delete(userId);
  }
});

router.get("/me", async (req, res) => {
  try {
    const items = await ProjectRecommendation.find({ userId: req.user.userId }).sort({ updatedAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recommendations", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await ProjectRecommendation.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!item) return res.status(404).json({ message: "Recommendation not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recommendation", error: error.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["saved", "in_progress", "completed", "recommended"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const item = await ProjectRecommendation.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!item) return res.status(404).json({ message: "Recommendation not found" });

    item.status = status;
    if (status === "saved") item.savedAt = new Date();
    if (status === "in_progress") item.startedAt = new Date();
    if (status === "completed") item.completedAt = new Date();

    await item.save();

    await recordProgressEvent(req.user.userId, "project_recommendation", `Project recommendation ${status}`, {
      recommendationId: item._id,
      title: item.title,
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Failed to update recommendation", error: error.message });
  }
});

module.exports = router;
