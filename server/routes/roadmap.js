const express = require("express");

const Roadmap = require("../models/Roadmap");
const SkillGap = require("../models/SkillGap");
const SkillConfidence = require("../models/SkillConfidence");
const User = require("../models/User");
const CareerRole = require("../models/CareerRole");
const authMiddleware = require("../middleware/auth");
const { generateRoadmapStructure } = require("../services/aiService");
const { recordProgressEvent } = require("../services/progressService");

const router = express.Router();

router.use(authMiddleware);

function generateDefaultTopicData(skillName, targetRole, skillContext) {
  const confidenceNote = skillContext.currentLevel !== null
    ? ` (current confidence ${skillContext.currentLevel}%)`
    : " (not yet assessed)";

  return {
    learningObjectives: [
      `Build practical proficiency in ${skillName}${confidenceNote}`,
      `Apply ${skillName} patterns relevant to ${targetRole} roles`,
      `Close the documented skill gap through focused practice`,
    ],
    recommendedTopics: [
      `${skillName} fundamentals and architecture`,
      `Role-specific workflows for ${targetRole}`,
      `Debugging, testing, and best practices`,
    ],
    estimatedDurationHours: skillContext.priority === "High" ? 8 : 6,
    practicalExercises: [
      `Complete guided exercises covering core ${skillName} concepts`,
      `Implement two small features that mirror ${targetRole} tasks`,
    ],
    miniProject: `Ship a mini ${targetRole} feature that demonstrates ${skillName} in a portfolio-ready way`,
  };
}

function attachResumeMeta(roadmap) {
  const plain = roadmap.toObject ? roadmap.toObject() : roadmap;
  const sortedItems = [...(plain.items || [])].sort((a, b) => a.weekNumber - b.weekNumber);
  const nextItem = sortedItems.find((item) => !item.isCompleted) || null;
  const continueItem = plain.lastAccessedItemId
    ? sortedItems.find((item) => String(item._id) === String(plain.lastAccessedItemId))
    : nextItem;

  return {
    ...plain,
    nextItem,
    continueItem: continueItem || nextItem,
  };
}

function prioritizeSkills(skills) {
  const priorityOrder = { High: 1, Medium: 2, Low: 3, "Assessment Required": 4, None: 5 };
  return [...skills].sort((a, b) => {
    const orderA = priorityOrder[a.priority] || 6;
    const orderB = priorityOrder[b.priority] || 6;
    if (orderA !== orderB) return orderA - orderB;
    return (b.gap ?? 0) - (a.gap ?? 0);
  });
}

router.post("/generate", async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.targetRole || !user.targetRole.trim()) {
      return res.status(400).json({
        message: "Please select a target career role in your Profile before generating a roadmap.",
      });
    }

    const gapAnalysis = await SkillGap.findOne({ userId }).lean();
    const confidences = await SkillConfidence.find({ userId }).lean();
    const confidenceBySkill = new Map(
      confidences.map((entry) => [entry.skillName, entry.confidenceScore])
    );

    let targetSkills = [];

    if (gapAnalysis?.skills?.length) {
      targetSkills = prioritizeSkills(
        gapAnalysis.skills.filter((skill) => skill.status !== "Meets Requirement")
      );
    }

    if (!targetSkills.length) {
      const role = await CareerRole.findOne({ title: user.targetRole.trim() }).lean();
      if (!role?.skills?.length) {
        return res.status(400).json({
          message: "No skill gaps found and no role skills available to build a roadmap.",
        });
      }

      targetSkills = prioritizeSkills(
        role.skills.map((skill) => ({
          skillName: skill.name,
          requiredLevel: skill.requiredLevel,
          currentLevel: confidenceBySkill.get(skill.name) ?? null,
          gap: confidenceBySkill.has(skill.name)
            ? Math.max(skill.requiredLevel - confidenceBySkill.get(skill.name), 0)
            : null,
          status: confidenceBySkill.has(skill.name) ? "Gap" : "Not Assessed",
          importance: skill.importance,
          priority: skill.importance === "High" ? "High" : "Medium",
        }))
      ).filter((skill) => skill.status !== "Meets Requirement");
    }

    if (!targetSkills.length) {
      return res.status(400).json({
        message: "All tracked skills meet requirements. Re-run gap analysis after new assessments to refresh your roadmap.",
      });
    }

    const items = [];

    for (let index = 0; index < targetSkills.length; index += 1) {
      const skillItem = targetSkills[index];
      const weekNumber = index + 1;

      let topicData;
      try {
        topicData = await generateRoadmapStructure(
          skillItem.skillName,
          user.targetRole,
          skillItem.priority
        );
      } catch {
        topicData = generateDefaultTopicData(skillItem.skillName, user.targetRole, skillItem);
      }

      items.push({
        weekNumber,
        title: `Week ${weekNumber}: ${skillItem.skillName}`,
        skillName: skillItem.skillName,
        priority: skillItem.priority || "Medium",
        learningObjectives: topicData.learningObjectives || [],
        recommendedTopics: topicData.recommendedTopics || [],
        estimatedDurationHours: topicData.estimatedDurationHours || 6,
        practicalExercises: topicData.practicalExercises || [],
        miniProject: topicData.miniProject || "",
        isCompleted: false,
      });
    }

    const firstItemId = items.length ? undefined : null;

    const roadmap = await Roadmap.findOneAndUpdate(
      { userId },
      {
        userId,
        targetRole: user.targetRole.trim(),
        items,
        progressPercentage: 0,
        lastAccessedItemId: firstItemId,
        generatedAt: new Date(),
      },
      { new: true, upsert: true, runValidators: true }
    );

    if (roadmap.items[0]) {
      roadmap.lastAccessedItemId = roadmap.items[0]._id;
      await roadmap.save();
    }

    await recordProgressEvent(userId, "roadmap", "Generated personalized learning roadmap", {
      weeks: items.length,
      targetRole: user.targetRole,
    });

    res.status(201).json(attachResumeMeta(roadmap));
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate learning roadmap",
      error: error.message,
    });
  }
});

router.get("/me", async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ userId: req.user.userId });

    if (!roadmap) {
      return res.status(404).json({ message: "No roadmap generated yet." });
    }

    res.json(attachResumeMeta(roadmap));
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch roadmap",
      error: error.message,
    });
  }
});

router.post("/continue", async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ userId: req.user.userId });

    if (!roadmap) {
      return res.status(404).json({ message: "No roadmap generated yet." });
    }

    const meta = attachResumeMeta(roadmap);
    const continueItem = meta.continueItem;

    if (continueItem) {
      roadmap.lastAccessedItemId = continueItem._id;
      await roadmap.save();
    }

    res.json(attachResumeMeta(roadmap));
  } catch (error) {
    res.status(500).json({
      message: "Failed to resume roadmap",
      error: error.message,
    });
  }
});

router.put("/toggle-item", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId, isCompleted } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: "itemId is required" });
    }

    const roadmap = await Roadmap.findOne({ userId });

    if (!roadmap) {
      return res.status(404).json({ message: "Roadmap not found" });
    }

    const item = roadmap.items.id(itemId);

    if (!item) {
      return res.status(404).json({ message: "Roadmap item not found" });
    }

    item.isCompleted = typeof isCompleted === "boolean" ? isCompleted : !item.isCompleted;
    item.completedAt = item.isCompleted ? new Date() : null;

    const completedCount = roadmap.items.filter((entry) => entry.isCompleted).length;
    roadmap.progressPercentage = roadmap.items.length
      ? Math.round((completedCount / roadmap.items.length) * 100)
      : 0;

    const nextIncomplete = [...roadmap.items]
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .find((entry) => !entry.isCompleted);

    roadmap.lastAccessedItemId = nextIncomplete ? nextIncomplete._id : item._id;

    await roadmap.save();

    await recordProgressEvent(userId, "roadmap", `Updated roadmap week: ${item.title}`, {
      itemId,
      isCompleted: item.isCompleted,
      progressPercentage: roadmap.progressPercentage,
    });

    res.json(attachResumeMeta(roadmap));
  } catch (error) {
    res.status(500).json({
      message: "Failed to update roadmap item",
      error: error.message,
    });
  }
});

module.exports = router;
