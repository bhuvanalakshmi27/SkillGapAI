const express = require("express");
const SkillAssessment = require("../models/SkillAssessment");
const SkillConfidence = require("../models/SkillConfidence");
const SkillTestResult = require("../models/SkillTestResult");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { recordProgressEvent } = require("../services/progressService");
const { skillsMatch } = require("../utils/skillNormalize");

const router = express.Router();

router.use(authMiddleware);

function classifyScore(score) {
  if (score < 40) return "Beginner";
  if (score < 70) return "Developing";
  if (score < 85) return "Intermediate";
  return "Strong";
}

router.get("/:userId", async (req, res) => {
  try {
    const targetUserId = req.params.userId === "me" ? req.user.userId : req.params.userId;

    if (targetUserId !== req.user.userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const confidences = await SkillConfidence.find({ userId: targetUserId }).sort({ updatedAt: -1 });
    res.json(confidences);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get skill confidence records",
      error: error.message,
    });
  }
});

router.get("/:userId/:skillName", async (req, res) => {
  try {
    const targetUserId = req.params.userId === "me" ? req.user.userId : req.params.userId;

    if (targetUserId !== req.user.userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const confidence = (await SkillConfidence.find({ userId: targetUserId }).sort({ updatedAt: -1 }))
      .find((entry) => skillsMatch(entry.skillName, req.params.skillName));

    if (!confidence) {
      return res.status(404).json({
        message: "Skill confidence not calculated yet",
      });
    }

    res.json(confidence);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get skill confidence",
      error: error.message,
    });
  }
});

router.post("/calculate", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { skillName } = req.body;

    if (typeof skillName !== "string" || !skillName.trim()) {
      return res.status(400).json({
        message: "skillName cannot be empty",
      });
    }

    const userExists = await User.exists({ _id: userId });

    if (!userExists) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const normalizedSkillName = skillName.trim();
    const selfAssessment = (await SkillAssessment.find({ userId }).sort({ updatedAt: -1 }))
      .find((entry) => skillsMatch(entry.skillName, normalizedSkillName));

    if (!selfAssessment) {
      return res.status(400).json({
        message: "Self assessment required before calculating confidence",
      });
    }

    const latestTestResult = (await SkillTestResult.find({ userId }).sort({ createdAt: -1 }))
      .find((entry) => skillsMatch(entry.skillName, normalizedSkillName));

    if (!latestTestResult) {
      return res.status(400).json({
        message: "Mini skill test required before calculating confidence",
      });
    }

    const confidenceScore = Math.round(
      (selfAssessment.selfRating * 0.4) + (latestTestResult.score * 0.6)
    );
    const level = classifyScore(confidenceScore);

    const confidence = await SkillConfidence.findOneAndUpdate(
      { userId, skillName: normalizedSkillName },
      {
        userId,
        skillName: normalizedSkillName,
        selfAssessmentScore: selfAssessment.selfRating,
        miniTestScore: latestTestResult.score,
        confidenceScore,
        level,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    await recordProgressEvent(userId, "skill_confidence", `Updated skill confidence: ${normalizedSkillName}`, {
      skillName: normalizedSkillName,
      confidenceScore,
    });

    res.json(confidence);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid skill confidence data",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to calculate skill confidence",
      error: error.message,
    });
  }
});

module.exports = router;
