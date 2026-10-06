const mongoose = require("mongoose");

const roadmapItemSchema = new mongoose.Schema(
  {
    weekNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    skillName: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low", "None", "Assessment Required"],
      default: "Medium",
    },
    learningObjectives: {
      type: [String],
      default: [],
    },
    recommendedTopics: {
      type: [String],
      default: [],
    },
    estimatedDurationHours: {
      type: Number,
      default: 5,
    },
    practicalExercises: {
      type: [String],
      default: [],
    },
    miniProject: {
      type: String,
      default: "",
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    targetRole: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [roadmapItemSchema],
      default: [],
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastAccessedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Roadmap", roadmapSchema);
