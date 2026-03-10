const express = require('express');
const router = express.Router();
const estimateController = require('../../controllers/organization/estimates/index');

router.get('/stats', estimateController.getEstimateStats);
router.get('/', estimateController.getAllEstimates);

module.exports = router;
