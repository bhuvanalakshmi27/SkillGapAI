const express = require("express");
const mongoose = require("mongoose");

const SkillGap = require("../models/SkillGap");
const User = require("../models/User");
const {
  getProviderErrorMessage,
  generateSkillExplanation,
} = require("../services/aiService");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.post("/skill-explanation", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { skillName } = req.body;

    if (typeof skillName !== "string" || !skillName.trim()) {
      return res.status(400).json({ message: "skillName cannot be empty" });
    }

    const userExists = await User.exists({ _id: userId });

    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    const analysis = await SkillGap.findOne({ userId }).lean();

    if (!analysis) {
      return res.status(400).json({ message: "Please complete Skill Gap Analysis first." });
    }

    const skill = analysis.skills.find((item) => item.skillName === skillName.trim());

    if (!skill) {
      return res.status(404).json({ message: "Skill not found in the current skill gap analysis." });
    }

    if (skill.currentLevel === null || skill.status === "Not Assessed") {
      return res.status(400).json({
        message: "Complete the skill assessment and mini skill test to get an AI explanation for this skill.",
      });
    }

    const explanation = await generateSkillExplanation({
      targetRole: analysis.targetRole,
      skillName: skill.skillName,
      requiredLevel: skill.requiredLevel,
      currentLevel: skill.currentLevel,
      gap: skill.gap,
      importance: skill.importance,
      priority: skill.priority,
      status: skill.status,
    });

    res.json({
      skillName: skill.skillName,
      targetRole: analysis.targetRole,
      ...explanation,
    });
  } catch (error) {
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

    res.status(502).json({
      message: error.message || "Unable to generate skill explanation",
    });
  }
});

module.exports = router;
