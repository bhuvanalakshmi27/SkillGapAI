const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    selectedAnswer: {
      type: String,
      default: "",
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

const skillTestResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    skillName: {
      type: String,
      required: true,
      trim: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 0,
    },
    correctAnswers: {
      type: Number,
      required: true,
      min: 0,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SkillTestResult", skillTestResultSchema);
