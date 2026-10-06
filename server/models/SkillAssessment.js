const mongoose = require("mongoose");

const skillAssessmentSchema = new mongoose.Schema(
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
    selfRating: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

skillAssessmentSchema.index({ userId: 1, skillName: 1 }, { unique: true });

module.exports = mongoose.model("SkillAssessment", skillAssessmentSchema);
