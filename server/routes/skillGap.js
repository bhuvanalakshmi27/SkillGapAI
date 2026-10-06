const express = require("express");
const mongoose = require("mongoose");

const CareerRole = require("../models/CareerRole");
const SkillConfidence = require("../models/SkillConfidence");
const SkillGap = require("../models/SkillGap");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { findBestSkillScore } = require("../utils/skillNormalize");
const { recordProgressEvent } = require("../services/progressService");

const router = express.Router();

router.use(authMiddleware);

function getPriority(gap, importance, status) {
  if (status === "Not Assessed") return "Assessment Required";
  if (gap === 0) return "None";

  if (importance === "High") {
    if (gap >= 30) return "High";
    if (gap >= 15) return "Medium";
    return "Low";
  }

  if (importance === "Medium") {
    if (gap >= 40) return "High";
    if (gap >= 20) return "Medium";
    return "Low";
  }

  if (gap >= 50) return "High";
  if (gap >= 25) return "Medium";
  return "Low";
}

router.post("/analyze", async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.targetRole || !user.targetRole.trim()) {
      return res.status(400).json({
        message: "Please select a target career role in your profile before running Skill Gap Analysis.",
      });
    }

    const careerRole = await CareerRole.findOne({ title: user.targetRole.trim() }).lean();

    if (!careerRole) {
      return res.status(404).json({
        message: `Selected target career role "${user.targetRole}" not found in our database. Please select a supported role.`,
      });
    }

    const confidences = await SkillConfidence.find({ userId }).lean();
    const confidenceBySkill = new Map(confidences.map((confidence) => [confidence.skillName, confidence.confidenceScore]));

    const skills = careerRole.skills.map((requiredSkill) => {
      const currentLevel = findBestSkillScore(requiredSkill.name, confidenceBySkill);
      const status = currentLevel === null
        ? "Not Assessed"
        : currentLevel >= requiredSkill.requiredLevel ? "Meets Requirement" : "Gap";
      const gap = currentLevel === null ? null : Math.max(requiredSkill.requiredLevel - currentLevel, 0);

      return {
        skillName: requiredSkill.name,
        requiredLevel: requiredSkill.requiredLevel,
        currentLevel,
        gap,
        status,
        importance: requiredSkill.importance,
        priority: getPriority(gap, requiredSkill.importance, status),
      };
    });

    const analysis = await SkillGap.findOneAndUpdate(
      { userId },
      {
        userId,
        targetRole: careerRole.title,
        skills,
        analyzedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    await recordProgressEvent(userId, "skill_gap", "Ran skill gap analysis", {
      targetRole: careerRole.title,
      skillCount: skills.length,
    });

    res.json(analysis);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid skill gap analysis data",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to analyze skill gap",
      error: error.message,
    });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const targetUserId = req.params.userId === "me" ? req.user.userId : req.params.userId;

    if (targetUserId !== req.user.userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const analysis = await SkillGap.findOne({ userId: targetUserId });

    if (!analysis) {
      return res.status(404).json({
        message: "No skill gap analysis available yet.",
      });
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get skill gap analysis",
      error: error.message,
    });
  }
});

module.exports = router;
