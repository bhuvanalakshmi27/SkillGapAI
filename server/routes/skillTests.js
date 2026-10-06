const express = require("express");
const mongoose = require("mongoose");

const SkillTest = require("../models/SkillTest");
const SkillTestResult = require("../models/SkillTestResult");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { recordProgressEvent } = require("../services/progressService");

const router = express.Router();

function selectRandomQuestions(questions, count) {
  return [...questions]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(count, questions.length));
}

// GET list of available test skills (public or auth)
router.get("/available", async (req, res) => {
  try {
    const tests = await SkillTest.find().select("skillName").sort({ skillName: 1 }).lean();
    res.json(tests.map((test) => test.skillName));
  } catch (error) {
    res.status(500).json({
      message: "Failed to list available skill tests",
      error: error.message,
    });
  }
});

// GET specific skill test questions
router.get("/:skillName", async (req, res) => {
  try {
    const skillTest = await SkillTest.findOne({ skillName: req.params.skillName }).lean();

    if (!skillTest) {
      return res.status(404).json({
        message: "Skill test not found",
      });
    }

    const questions = selectRandomQuestions(skillTest.questions, 5).map(({ _id, question, options }) => ({
      questionId: String(_id),
      question,
      options,
    }));

    res.json({
      skillName: skillTest.skillName,
      questions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get skill test",
      error: error.message,
    });
  }
});

// Below routes require authentication
router.use(authMiddleware);

router.get("/results/:userId/:skillName", async (req, res) => {
  try {
    const targetUserId = req.params.userId === "me" ? req.user.userId : req.params.userId;
    const { skillName } = req.params;

    if (targetUserId !== req.user.userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const results = await SkillTestResult.find({ userId: targetUserId, skillName }).sort({ createdAt: -1 }).lean();

    res.json({
      skillName,
      latestScore: results[0]?.score ?? null,
      bestScore: results.length ? Math.max(...results.map((result) => result.score)) : null,
      totalAttempts: results.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get skill test summary",
      error: error.message,
    });
  }
});

router.get("/results/:userId", async (req, res) => {
  try {
    const targetUserId = req.params.userId === "me" ? req.user.userId : req.params.userId;

    if (targetUserId !== req.user.userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const results = await SkillTestResult.find({ userId: targetUserId })
      .select("skillName score correctAnswers totalQuestions createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json(results);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get skill test history",
      error: error.message,
    });
  }
});

router.post("/submit", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { skillName, answers } = req.body;

    if (typeof skillName !== "string" || !skillName.trim()) {
      return res.status(400).json({
        message: "skillName cannot be empty",
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "answers must be an array",
      });
    }

    const userExists = await User.exists({ _id: userId });

    if (!userExists) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const skillTest = await SkillTest.findOne({ skillName: skillName.trim() }).lean();

    if (!skillTest) {
      return res.status(404).json({
        message: "Skill test not found",
      });
    }

    const questionById = new Map(skillTest.questions.map((question) => [String(question._id), question]));
    const submittedAnswers = new Map(
      answers
        .filter((answer) => answer && answer.questionId && questionById.has(String(answer.questionId)))
        .map((answer) => [String(answer.questionId), answer.selectedAnswer || ""])
    );

    if (!submittedAnswers.size) {
      return res.status(400).json({
        message: "At least one valid answer is required",
      });
    }

    const evaluatedAnswers = [...submittedAnswers.entries()].map(([questionId, selectedAnswer]) => {
      const question = questionById.get(questionId);

      return {
        questionId,
        selectedAnswer,
        isCorrect: selectedAnswer === question.correctAnswer,
      };
    });

    const correctAnswers = evaluatedAnswers.filter((answer) => answer.isCorrect).length;
    const totalQuestions = evaluatedAnswers.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);

    const result = await SkillTestResult.create({
      userId,
      skillName: skillTest.skillName,
      totalQuestions,
      correctAnswers,
      score,
      answers: evaluatedAnswers,
    });

    const review = evaluatedAnswers.map((evaluatedAnswer) => {
      const question = questionById.get(evaluatedAnswer.questionId);

      return {
        questionId: evaluatedAnswer.questionId,
        question: question.question,
        selectedAnswer: evaluatedAnswer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: evaluatedAnswer.isCorrect,
        explanation: question.explanation,
      };
    });

    await recordProgressEvent(userId, "skill_test", `Submitted mini test: ${skillTest.skillName}`, {
      skillName: skillTest.skillName,
      score,
    });

    res.status(201).json({
      result,
      review,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit skill test",
      error: error.message,
    });
  }
});

module.exports = router;
