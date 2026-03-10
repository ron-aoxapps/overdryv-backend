const express = require('express');
const router = express.Router();
const vehicleController = require('../../controllers/organization/vehicles/index');

router.get('/stats', vehicleController.getVehicleStats);
router.get('/customer/:customerId', vehicleController.listCustomerVehicles);
router.post('/', vehicleController.createVehicle);
router.get('/', vehicleController.getAllVehicles);
router.put('/:vehicleId', vehicleController.updateVehicle);

module.exports = router;
