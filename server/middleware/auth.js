const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. Authentication token is missing.",
      });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "skillgapai_super_secret_key_2026";

    const decoded = jwt.verify(token, secret);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    req.user = {
      userId: String(decoded.userId),
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please log in again.",
      });
    }

    return res.status(401).json({
      message: "Invalid authentication token.",
    });
  }
}

module.exports = authMiddleware;
