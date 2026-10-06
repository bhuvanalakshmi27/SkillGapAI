const mongoose = require("mongoose");

const jobAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobTitle: { type: String, default: "" },
    sourceTextPreview: { type: String, default: "" },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    experienceRequirements: { type: [String], default: [] },
    importantKeywords: { type: [String], default: [] },
    matchingSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    priorityGaps: { type: [String], default: [] },
    demonstratedProjectSkills: { type: [String], default: [] },
    usefulResumeKeywords: { type: [String], default: [] },
    recommendedPreparation: { type: [String], default: [] },
    profileAlignmentScore: { type: Number, default: null, min: 0, max: 100 },
    profileAlignmentLabel: { type: String, default: "" },
    targetRoleAtAnalysis: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobAnalysis", jobAnalysisSchema);
