const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticateJWT");
const authorizeRole = require("../middlewares/autherizeRole");
const authRoutes = require("./authRoutes");

router.use("/auth", authRoutes);

module.exports = router;
