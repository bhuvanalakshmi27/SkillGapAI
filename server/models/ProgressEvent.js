const mongoose = require("mongoose");

const progressEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "skill_assessment",
        "skill_test",
        "skill_confidence",
        "skill_gap",
        "roadmap",
        "project_recommendation",
        "project_evidence",
        "resume_analysis",
        "job_analysis",
        "profile",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

progressEventSchema.index({ userId: 1, occurredAt: -1 });

module.exports = mongoose.model("ProgressEvent", progressEventSchema);
