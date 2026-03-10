const jwt = require("jsonwebtoken");
const prisma = require("../client/prismaClient");
require("dotenv").config();

const authenticate = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Access denied. No token provided or invalid format.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const profile = await prisma.profile.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        organization_id: true,
        access_token: true,
      },
    });

    if (!profile) {
      return res.status(401).json({ error: "User not found." });
    }

    if (profile.access_token !== token) {
      return res.status(401).json({
        error: "Session expired or logged in from another device.",
      });
    }

    req.userId = profile.id;
    req.userEmail = profile.email;
    req.role = profile.role;
    req.organizationId = profile.organization_id;

    next();

  } catch (error) {

    console.log(error)

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token has expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token.",
      });
    }

    return res.status(401).json({
      error: "Authentication failed.",
    });
  }
};

module.exports = authenticate;