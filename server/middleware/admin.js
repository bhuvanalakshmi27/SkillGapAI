const User = require("../models/User");

async function adminMiddleware(req, res, next) {
  try {
    const user = await User.findById(req.user.userId).select("role").lean();

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Failed to verify admin access",
      error: error.message,
    });
  }
}

module.exports = adminMiddleware;
