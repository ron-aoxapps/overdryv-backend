const express = require("express");
const router = express.Router();
const customerRoutes = require("./customerRoutes");
const partRoutes = require("./partRoutes");
const vehicleRoutes = require("./vehicleRoutes");
const workOrderRoutes = require("./workOrderRoutes");
const estimateRoutes = require("./estimateRoutes");

router.use("/customers",  customerRoutes);
router.use("/parts",  partRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/work-orders", workOrderRoutes);
router.use("/estimates", estimateRoutes);

module.exports = router;
