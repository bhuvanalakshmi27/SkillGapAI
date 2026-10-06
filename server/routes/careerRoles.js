const express = require("express");
const mongoose = require("mongoose");

const CareerRole = require("../models/CareerRole");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const careerRoles = await CareerRole.find().sort({ title: 1 });
    res.json(careerRoles);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get career roles",
      error: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid career role ID",
      });
    }

    const careerRole = await CareerRole.findById(req.params.id);

    if (!careerRole) {
      return res.status(404).json({
        message: "Career role not found",
      });
    }

    res.json(careerRole);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get career role",
      error: error.message,
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const careerRole = await CareerRole.create(req.body);
    res.status(201).json(careerRole);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid career role data",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to create career role",
      error: error.message,
    });
  }
});

module.exports = router;
