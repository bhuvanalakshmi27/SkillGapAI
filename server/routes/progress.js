const express = require("express");

const ProgressEvent = require("../models/ProgressEvent");
const SkillConfidence = require("../models/SkillConfidence");
const SkillTestResult = require("../models/SkillTestResult");
const SkillAssessment = require("../models/SkillAssessment");
const ProjectEvidence = require("../models/ProjectEvidence");
const ResumeAnalysis = require("../models/ResumeAnalysis");
const JobAnalysis = require("../models/JobAnalysis");
const Roadmap = require("../models/Roadmap");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

function startOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

router.get("/me", async (req, res) => {
  try {
    const userId = req.user.userId;
    const since = new Date();
    since.setDate(since.getDate() - 84);

    const [events, confidences, testResults, assessmentCount, projectCount, resumeCount, jobCount, roadmap] = await Promise.all([
      ProgressEvent.find({ userId, occurredAt: { $gte: since } }).sort({ occurredAt: -1 }),
      SkillConfidence.find({ userId }).lean(),
      SkillTestResult.find({ userId, createdAt: { $gte: since } }).sort({ createdAt: -1 }).lean(),
      SkillAssessment.countDocuments({ userId }),
      ProjectEvidence.countDocuments({ userId, status: "completed" }),
      ResumeAnalysis.countDocuments({ userId }),
      JobAnalysis.countDocuments({ userId }),
      Roadmap.findOne({ userId }).select("progressPercentage").lean(),
    ]);

    const weeklyMap = new Map();

    events.forEach((event) => {
      const key = startOfWeek(event.occurredAt).toISOString();
      if (!weeklyMap.has(key)) {
        weeklyMap.set(key, {
          weekStart: key,
          activities: 0,
          byType: {},
        });
      }
      const bucket = weeklyMap.get(key);
      bucket.activities += 1;
      bucket.byType[event.type] = (bucket.byType[event.type] || 0) + 1;
    });

    const weeklyProgress = [...weeklyMap.values()].sort(
      (left, right) => new Date(left.weekStart) - new Date(right.weekStart)
    );

    const confidenceTrend = confidences
      .filter((entry) => typeof entry.confidenceScore === "number")
      .map((entry) => ({
        skill: entry.skillName,
        confidence: entry.confidenceScore,
        updatedAt: entry.updatedAt,
      }))
      .sort((left, right) => left.skill.localeCompare(right.skill));

    const testScoreTrend = testResults.map((result) => ({
      skill: result.skillName,
      score: result.score,
      date: result.createdAt,
    }));

    res.json({
      weeklyProgress,
      recentActivities: events.slice(0, 30).map((event) => ({
        type: event.type,
        title: event.title,
        occurredAt: event.occurredAt,
        metadata: event.metadata,
      })),
      confidenceTrend,
      testScoreTrend,
      totals: {
        events: events.length,
        tests: testResults.length,
        trackedSkills: confidences.length,
        skillsAssessed: assessmentCount,
        projectsCompleted: projectCount,
        resumeAnalyses: resumeCount,
        jobAnalyses: jobCount,
        roadmapProgress: roadmap?.progressPercentage ?? null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch progress history", error: error.message });
  }
});

module.exports = router;
