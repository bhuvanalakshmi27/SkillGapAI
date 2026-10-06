const express = require("express");

const SkillGap = require("../models/SkillGap");
const SkillTestResult = require("../models/SkillTestResult");
const ProjectEvidence = require("../models/ProjectEvidence");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const Roadmap = require("../models/Roadmap");
const authMiddleware = require("../middleware/auth");
const { buildReadinessPayload } = require("../services/readinessService");

const router = express.Router();

router.use(authMiddleware);

router.get("/me", async (req, res) => {
  try {
    const userId = req.user.userId;

    const [gap, testCount, projects, latestResume, roadmap] = await Promise.all([
      SkillGap.findOne({ userId }).lean(),
      SkillTestResult.countDocuments({ userId }),
      ProjectEvidence.find({ userId }).lean(),
      ResumeAnalysis.findOne({ userId }).sort({ createdAt: -1 }).lean(),
      Roadmap.findOne({ userId }).lean(),
    ]);

    const payload = buildReadinessPayload({
      gapSkills: gap?.skills || [],
      testCount,
      projects,
      latestResume,
      roadmap,
    });

    res.json({
      targetRole: gap?.targetRole || roadmap?.targetRole || "",
      analyzedAt: gap?.analyzedAt || null,
      ...payload,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to compute career readiness", error: error.message });
  }
});

module.exports = router;
