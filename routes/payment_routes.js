const express = require('express');
const router = express.Router();
const { createPayment } = require('../controllers/payment_controller');
const { authenticateToken } = require('../middlewares/jwt_verify');

router.post('/create', authenticateToken, createPayment); // Create a new payment

module.exports = router;
