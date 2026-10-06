const express = require("express");

const ProjectEvidence = require("../models/ProjectEvidence");
const authMiddleware = require("../middleware/auth");
const { recordProgressEvent } = require("../services/progressService");
const { buildProjectUpdate } = require("../utils/projectValidation");

const router = express.Router();

router.use(authMiddleware);

router.get("/me", async (req, res) => {
  try {
    const projects = await ProjectEvidence.find({ userId: req.user.userId }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch project evidence", error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      projectName,
      description,
      technologies,
      skillsDemonstrated,
      githubUrl,
      liveDemoUrl,
      completionDate,
      difficulty,
      status,
      screenshotUrls,
    } = req.body;

    if (!projectName?.trim()) {
      return res.status(400).json({ message: "Project name is required" });
    }

    const project = await ProjectEvidence.create({
      userId,
      projectName: projectName.trim(),
      description: description || "",
      technologies: Array.isArray(technologies) ? technologies : [],
      skillsDemonstrated: Array.isArray(skillsDemonstrated) ? skillsDemonstrated : [],
      githubUrl: githubUrl || "",
      liveDemoUrl: liveDemoUrl || "",
      completionDate: completionDate ? new Date(completionDate) : null,
      difficulty: difficulty || "Intermediate",
      status: status || "in_progress",
      screenshotUrls: Array.isArray(screenshotUrls) ? screenshotUrls : [],
    });

    await recordProgressEvent(userId, "project_evidence", `Added project evidence: ${project.projectName}`, {
      projectId: project._id,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: "Failed to create project evidence", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const update = buildProjectUpdate(req.body);
    if (!Object.keys(update).length) {
      return res.status(400).json({ message: "At least one editable project field is required" });
    }

    const project = await ProjectEvidence.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      update,
      { new: true, runValidators: true }
    );

    if (!project) return res.status(404).json({ message: "Project not found" });

    await recordProgressEvent(req.user.userId, "project_evidence", `Updated project evidence: ${project.projectName}`, {
      projectId: project._id,
    });

    res.json(project);
  } catch (error) {
    const status = /required|must be|valid URL|HTTP or HTTPS|array/.test(error.message) ? 400 : 500;
    res.status(status).json({ message: status === 400 ? error.message : "Failed to update project evidence", error: error.message });
  }
});

router.patch("/:id/complete", async (req, res) => {
  try {
    const project = await ProjectEvidence.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!project) return res.status(404).json({ message: "Project not found" });

    project.status = "completed";
    project.completionDate = project.completionDate || new Date();
    await project.save();

    await recordProgressEvent(req.user.userId, "project_evidence", `Completed project: ${project.projectName}`, {
      projectId: project._id,
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Failed to complete project", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const project = await ProjectEvidence.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!project) return res.status(404).json({ message: "Project not found" });

    res.json({ message: "Project evidence deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete project evidence", error: error.message });
  }
});

module.exports = router;
