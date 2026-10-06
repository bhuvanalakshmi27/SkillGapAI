const express = require("express");

const User = require("../models/User");
const SkillGap = require("../models/SkillGap");
const SkillTestResult = require("../models/SkillTestResult");
const Roadmap = require("../models/Roadmap");
const ProjectEvidence = require("../models/ProjectEvidence");
const ProgressEvent = require("../models/ProgressEvent");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/analytics", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalStudents,
      activeStudents,
      gaps,
      testCount,
      roadmapCount,
      projectCount,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      ProgressEvent.distinct("userId", { occurredAt: { $gte: thirtyDaysAgo } }),
      SkillGap.find({}).select("targetRole skills.skillName skills.priority skills.status").lean(),
      SkillTestResult.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Roadmap.countDocuments({ updatedAt: { $gte: thirtyDaysAgo } }),
      ProjectEvidence.countDocuments({ updatedAt: { $gte: thirtyDaysAgo } }),
      ProgressEvent.countDocuments({ occurredAt: { $gte: thirtyDaysAgo } }),
    ]);

    const roleCounts = new Map();
    const gapCounts = new Map();

    gaps.forEach((gap) => {
      roleCounts.set(gap.targetRole, (roleCounts.get(gap.targetRole) || 0) + 1);
      (gap.skills || [])
        .filter((skill) => skill.status === "Gap")
        .forEach((skill) => {
          gapCounts.set(skill.skillName, (gapCounts.get(skill.skillName) || 0) + 1);
        });
    });

    const popularTargetRoles = [...roleCounts.entries()]
      .map(([role, count]) => ({ role, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8);

    const commonSkillGaps = [...gapCounts.entries()]
      .map(([skill, count]) => ({ skill, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 10);

    res.json({
      totalStudents,
      activeStudents: activeStudents.length,
      popularTargetRoles,
      commonSkillGaps,
      activity: {
        testsLast30Days: testCount,
        roadmapUpdatesLast30Days: roadmapCount,
        projectUpdatesLast30Days: projectCount,
        eventsLast30Days: recentActivity,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load admin analytics", error: error.message });
  }
});

module.exports = router;
