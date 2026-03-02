const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticate = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Access denied. No token provided or invalid format." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, role } = decoded;
    if (decoded.clientId) {
      req.clientId = decoded.clientId;
    }
    req.userId = userId;
    req.role = role;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token has expired. Please log in again." });
    } else if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ error: "Invalid token. Please provide a valid token." });
    } else {
      return res.status(401).json({ error: "Authentication failed." });
    }
  }
};

module.exports = authenticate;
