const express = require("express");
const SkillAssessment = require("../models/SkillAssessment");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { skillsMatch } = require("../utils/skillNormalize");

const router = express.Router();

router.use(authMiddleware);

router.post("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { skillName, selfRating, notes } = req.body;

    if (typeof skillName !== "string" || !skillName.trim()) {
      return res.status(400).json({
        message: "skillName cannot be empty",
      });
    }

    if (typeof selfRating !== "number" || !Number.isFinite(selfRating) || selfRating < 0 || selfRating > 100) {
      return res.status(400).json({
        message: "selfRating must be a number between 0 and 100",
      });
    }

    const userExists = await User.exists({ _id: userId });

    if (!userExists) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const existing = (await SkillAssessment.find({ userId }).sort({ updatedAt: -1 }))
      .find((entry) => skillsMatch(entry.skillName, skillName.trim()));
    const assessment = await SkillAssessment.findOneAndUpdate(
      existing ? { _id: existing._id, userId } : { userId, skillName: skillName.trim() },
      {
        userId,
        skillName: skillName.trim(),
        selfRating,
        notes: typeof notes === "string" ? notes.trim() : "",
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json(assessment);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid skill assessment data",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to save skill assessment",
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

    const assessments = await SkillAssessment.find({ userId: targetUserId }).sort({ skillName: 1 });
    res.json(assessments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get skill assessments",
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

    const assessment = await SkillAssessment.findOne({
      userId: targetUserId,
      skillName: req.params.skillName.trim(),
    });

    if (!assessment) {
      return res.status(404).json({
        message: "Skill assessment not found",
      });
    }

    res.json(assessment);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get skill assessment",
      error: error.message,
    });
  }
});

module.exports = router;
