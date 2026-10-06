const mongoose = require("mongoose");

const skillConfidenceSchema = new mongoose.Schema(
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
    selfAssessmentScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    miniTestScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    level: {
      type: String,
      required: true,
      enum: ["Beginner", "Developing", "Intermediate", "Strong"],
    },
  },
  {
    timestamps: true,
  }
);

skillConfidenceSchema.index({ userId: 1, skillName: 1 }, { unique: true });

module.exports = mongoose.model("SkillConfidence", skillConfidenceSchema);
