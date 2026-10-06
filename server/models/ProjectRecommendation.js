const mongoose = require("mongoose");

const projectRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },
    estimatedEffortHours: { type: Number, default: 8 },
    technologies: { type: [String], default: [] },
    skillsPracticed: { type: [String], default: [] },
    relatedSkillGaps: { type: [String], default: [] },
    targetRole: { type: String, default: "" },
    targetRoleRelationship: { type: String, default: "" },
    whyRecommended: { type: String, default: "" },
    expectedOutcome: { type: String, default: "" },
    status: {
      type: String,
      enum: ["recommended", "saved", "in_progress", "completed"],
      default: "recommended",
    },
    savedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectRecommendation", projectRecommendationSchema);
