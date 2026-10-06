const express = require("express");

const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

function getAiSettings() {
  const configured = Boolean(process.env.GEMINI_API_KEY?.trim());
  return {
    provider: "Gemini",
    status: configured ? "Configured" : "Not configured",
  };
}

router.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("name email college branch graduationYear targetRole role").lean();
    if (!user) return res.status(404).json({ message: "Account not found." });

    res.json({
      account: user,
      security: {
        authentication: "JWT authentication",
        session: "Active session",
      },
      integrations: getAiSettings(),
      version: "1.0.0",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load workspace settings", error: error.message });
  }
});

module.exports = router;
