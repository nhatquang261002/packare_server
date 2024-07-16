const express = require('express');
const router = express.Router();

const { 
    generateMockAccounts, 
    generateMockOrders, 
    deleteAllMockAccounts, 
    deleteAllMockOrders 
} = require('../controllers/mock_controller');

// Route to generate accounts
router.post('/generate-accounts', generateMockAccounts);

// Route to generate orders
router.post('/generate-orders', generateMockOrders);

// Route to delete all mock accounts
router.delete('/delete-mock-accounts', deleteAllMockAccounts);

// Route to delete all mock orders
router.delete('/delete-mock-orders', deleteAllMockOrders);

module.exports = router;
