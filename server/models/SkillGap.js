const mongoose = require("mongoose");

const skillGapItemSchema = new mongoose.Schema(
  {
    skillName: {
      type: String,
      required: true,
      trim: true,
    },
    requiredLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    currentLevel: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    gap: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["Meets Requirement", "Gap", "Not Assessed"],
      required: true,
    },
    importance: {
      type: String,
      enum: ["High", "Medium", "Low"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low", "None", "Assessment Required"],
      required: true,
    },
  },
  { _id: false }
);

const skillGapSchema = new mongoose.Schema(
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
    skills: {
      type: [skillGapItemSchema],
      default: [],
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SkillGap", skillGapSchema);
