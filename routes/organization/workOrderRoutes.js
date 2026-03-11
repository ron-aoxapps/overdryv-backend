const express = require('express');
const router = express.Router();
const workOrderController = require('../../controllers/organization/workOrders/index');

router.get('/stats', workOrderController.getWorkOrderStats);
router.get('/', workOrderController.getAllWorkOrders);
router.get('/:id', workOrderController.getWorkOrderById);
router.post('/', workOrderController.createWorkOrder);
router.put('/:id', workOrderController.updateWorkOrder);
router.delete('/:id', workOrderController.deleteWorkOrder);

module.exports = router;
