const express = require("express");
const User = require("../models/User");
const CareerRole = require("../models/CareerRole");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

// GET PROFILE
router.get("/:userId", async (req, res) => {
  try {
    const targetUserId = req.params.userId === "me" ? req.user.userId : req.params.userId;

    if (targetUserId !== req.user.userId) {
      return res.status(403).json({ message: "Access denied. You can only view your own profile." });
    }

    const user = await User.findById(targetUserId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get profile",
      error: error.message,
    });
  }
});

// UPDATE PROFILE
router.put("/:userId", async (req, res) => {
  try {
    const targetUserId = req.params.userId === "me" ? req.user.userId : req.params.userId;

    if (targetUserId !== req.user.userId) {
      return res.status(403).json({ message: "Access denied. You can only update your own profile." });
    }

    const { college, branch, graduationYear, targetRole, skills } = req.body;
    const normalizedTargetRole = typeof targetRole === "string" ? targetRole.trim() : "";
    if (normalizedTargetRole) {
      const roleExists = await CareerRole.exists({ title: normalizedTargetRole });
      if (!roleExists) {
        return res.status(400).json({ message: "Selected target career role is not available." });
      }
    }

    if (!Array.isArray(skills)) {
      return res.status(400).json({ message: "Skills must be provided as an array." });
    }

    const user = await User.findByIdAndUpdate(
      targetUserId,
      {
        college,
        branch,
        graduationYear,
        targetRole: normalizedTargetRole,
        skills: skills.map((skill) => String(skill).trim()).filter(Boolean),
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Profile update failed",
      error: error.message,
    });
  }
});

module.exports = router;