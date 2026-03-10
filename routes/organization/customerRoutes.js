const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/organization/customers/index');

router.get('/stats', customerController.getCustomerStats);
router.get('/search', customerController.searchCustomer);
router.get('/list', customerController.listAllCustomers);
router.get('/:customerId/work-orders', customerController.getCustomerWorkOrders);
router.patch('/:customerId', customerController.updateCustomer);
router.post('/', customerController.createCustomer);
router.get('/', customerController.getAllCustomers);

module.exports = router;
