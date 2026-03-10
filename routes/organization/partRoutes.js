const express = require('express');
const router = express.Router();
const partController = require('../../controllers/organization/parts/index');

router.get('/', partController.getAllParts);
router.get('/stats', partController.getPartsStats);
router.put('/stock/:partId', partController.updateStockQuantity);
router.put('/:partId', partController.updatePart);
router.post('/', partController.createPart);
router.get('/analytics', partController.getInventoryAnalytics);

module.exports = router;
