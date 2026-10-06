const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const careerRoleRoutes = require("./routes/careerRoles");
const skillAssessmentRoutes = require("./routes/skillAssessment");
const skillTestRoutes = require("./routes/skillTests");
const skillConfidenceRoutes = require("./routes/skillConfidence");
const skillGapRoutes = require("./routes/skillGap");
const aiRoutes = require("./routes/ai");
const roadmapRoutes = require("./routes/roadmap");
const projectRecommendationRoutes = require("./routes/projectRecommendations");
const projectEvidenceRoutes = require("./routes/projectEvidence");
const resumeAnalysisRoutes = require("./routes/resumeAnalysis");
const jobAnalyzerRoutes = require("./routes/jobAnalyzer");
const careerReadinessRoutes = require("./routes/careerReadiness");
const progressRoutes = require("./routes/progress");
const adminRoutes = require("./routes/admin");
const settingsRoutes = require("./routes/settings");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/career-roles", careerRoleRoutes);
app.use("/api/skill-assessment", skillAssessmentRoutes);
app.use("/api/skill-tests", skillTestRoutes);
app.use("/api/skill-confidence", skillConfidenceRoutes);
app.use("/api/skill-gap", skillGapRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/project-recommendations", projectRecommendationRoutes);
app.use("/api/project-evidence", projectEvidenceRoutes);
app.use("/api/resume-analysis", resumeAnalysisRoutes);
app.use("/api/job-analyzer", jobAnalyzerRoutes);
app.use("/api/career-readiness", careerReadinessRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);

// Home route
app.get("/", (req, res) => {
  res.send("SkillGap AI Backend is running!");
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});