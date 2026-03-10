const express = require('express');
const router = express.Router();
const workOrderController = require('../../controllers/organization/workOrders/index');

router.get('/stats', workOrderController.getWorkOrderStats);
router.get('/', workOrderController.getAllWorkOrders);

module.exports = router;
