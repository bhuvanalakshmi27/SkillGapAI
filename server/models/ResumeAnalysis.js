const mongoose = require("mongoose");

const resumeAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalFileName: { type: String, default: "" },
    storedFileName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    extractedTextPreview: { type: String, default: "" },
    skills: { type: [String], default: [] },
    education: { type: [String], default: [] },
    projects: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    experience: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    representedSkills: { type: [String], default: [] },
    skillsNotClearlyRepresented: { type: [String], default: [] },
    missingKeywords: { type: [String], default: [] },
    inconsistencies: { type: [String], default: [] },
    improvementSuggestions: { type: [String], default: [] },
    targetRoleAtAnalysis: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);
