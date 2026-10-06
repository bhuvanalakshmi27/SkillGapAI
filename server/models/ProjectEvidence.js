const mongoose = require("mongoose");

const projectEvidenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    projectName: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    technologies: { type: [String], default: [] },
    skillsDemonstrated: { type: [String], default: [] },
    githubUrl: { type: String, default: "" },
    liveDemoUrl: { type: String, default: "" },
    completionDate: { type: Date, default: null },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },
    status: {
      type: String,
      enum: ["planned", "in_progress", "completed"],
      default: "in_progress",
    },
    screenshotUrls: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectEvidence", projectEvidenceSchema);
