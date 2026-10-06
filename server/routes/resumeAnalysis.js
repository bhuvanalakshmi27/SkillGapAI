const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const ResumeAnalysis = require("../models/ResumeAnalysis");
const User = require("../models/User");
const SkillGap = require("../models/SkillGap");
const SkillConfidence = require("../models/SkillConfidence");
const ProjectEvidence = require("../models/ProjectEvidence");
const authMiddleware = require("../middleware/auth");
const { extractTextFromFile, parseResumeHeuristics } = require("../services/resumeParser");
const { enrichResumeAnalysis } = require("../services/aiService");
const { recordProgressEvent } = require("../services/progressService");

const router = express.Router();

router.use(authMiddleware);

const uploadRoot = path.join(__dirname, "..", "uploads", "resumes");

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadRoot, String(req.user.userId));
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PDF or DOCX files are allowed"));
  },
});

function compareWithProfile(parsed, profileSkills, gapSkills) {
  const resumeTokens = new Set(
    [...parsed.skills, ...parsed.keywords].map((item) => String(item).toLowerCase())
  );

  const representedSkills = profileSkills.filter((skill) =>
    resumeTokens.has(skill.toLowerCase()) ||
    [...resumeTokens].some((token) => token.includes(skill.toLowerCase()))
  );

  const skillsNotClearlyRepresented = gapSkills
    .map((skill) => skill.skillName)
    .filter((skillName) => !representedSkills.some((item) => item.toLowerCase() === skillName.toLowerCase()));

  return { representedSkills, skillsNotClearlyRepresented };
}

router.get("/history", async (req, res) => {
  try {
    const history = await ResumeAnalysis.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .select("-extractedTextPreview");
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch resume history", error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const record = await ResumeAnalysis.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!record) return res.status(404).json({ message: "Resume analysis not found" });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch resume analysis", error: error.message });
  }
});

router.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: "Upload a PDF or DOCX resume file." });
    }

    const user = await User.findById(userId).lean();
    const [gap, confidences, projects] = await Promise.all([
      SkillGap.findOne({ userId }).lean(),
      SkillConfidence.find({ userId }).lean(),
      ProjectEvidence.find({ userId }).lean(),
    ]);

    const text = await extractTextFromFile(req.file.path, req.file.mimetype);
    if (!text.trim()) {
      const error = new Error("The uploaded resume contains no readable text. Upload a text-based PDF or DOCX file.");
      error.status = 422;
      error.code = "RESUME_TEXT_EMPTY";
      throw error;
    }
    const parsed = parseResumeHeuristics(text);
    const profileSkills = [
      ...(user?.skills || []),
      ...(gap?.skills || []).map((skill) => skill.skillName),
    ];

    const baseline = compareWithProfile(parsed, [...new Set(profileSkills)], gap?.skills || []);

    const aiContext = {
      targetRole: user?.targetRole || "",
      profileSkills,
      skillConfidence: confidences.map((entry) => ({
        skillName: entry.skillName,
        confidenceScore: entry.confidenceScore,
      })),
      projectEvidence: projects.map((project) => project.projectName),
      parsedResume: parsed,
      baselineComparison: baseline,
    };

    let enriched = {
      representedSkills: baseline.representedSkills,
      skillsNotClearlyRepresented: baseline.skillsNotClearlyRepresented,
      missingKeywords: [],
      inconsistencies: [],
      improvementSuggestions: [],
    };

    try {
      const ai = await enrichResumeAnalysis(aiContext);
      enriched = { ...enriched, ...ai };
    } catch {
      enriched.improvementSuggestions = [
        "Add measurable outcomes to project bullets.",
        "Mirror target role keywords in your skills section.",
        "Ensure profile skills with high priority gaps appear on your resume.",
      ];
    }

    const record = await ResumeAnalysis.create({
      userId,
      originalFileName: req.file.originalname,
      storedFileName: req.file.filename,
      mimeType: req.file.mimetype,
      extractedTextPreview: text.slice(0, 1200),
      skills: parsed.skills,
      education: parsed.education,
      projects: parsed.projects,
      certifications: parsed.certifications,
      experience: parsed.experience,
      keywords: parsed.keywords,
      representedSkills: enriched.representedSkills || [],
      skillsNotClearlyRepresented: enriched.skillsNotClearlyRepresented || [],
      missingKeywords: enriched.missingKeywords || [],
      inconsistencies: enriched.inconsistencies || [],
      improvementSuggestions: enriched.improvementSuggestions || [],
      targetRoleAtAnalysis: user?.targetRole || "",
    });

    await recordProgressEvent(userId, "resume_analysis", "Completed resume analysis", {
      analysisId: record._id,
    });

    res.status(201).json(record);
  } catch (error) {
    if (req.file?.path) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") {
          console.error("Failed to clean up resume upload", cleanupError);
        }
      }
    }

    res.status(error.status || 500).json({
      message: error.message || "Resume analysis failed",
      ...(error.code ? { code: error.code } : {}),
    });
  }
});

router.use((error, req, res, next) => {
  if (!error) return next();

  const isUploadError = error instanceof multer.MulterError || error.message?.includes("Only PDF or DOCX");
  if (isUploadError) {
    return res.status(400).json({ message: error.message || "Resume upload failed" });
  }

  return res.status(500).json({ message: "Resume analysis failed", error: error.message });
});

module.exports = router;
