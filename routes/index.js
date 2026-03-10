const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authenticateJWT");
const authorizeRole = require("../middlewares/autherizeRole");
const authRoutes = require("./authRoutes");
const organizationRoutes = require("./organization/index");


router.use("/auth", authRoutes);
router.use("/organization", authenticate, authorizeRole("admin"), organizationRoutes);

module.exports = router;
