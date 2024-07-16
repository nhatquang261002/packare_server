const express = require('express');
const router = express.Router();
const { createWallet, getWalletBalance, getTransactionHistory } = require('../controllers/wallet_controller');
const { authenticateToken } = require('../middlewares/jwt_verify');

router.post('/create', authenticateToken, createWallet); // Create a new wallet
router.get('/balance/:user_id', authenticateToken,  getWalletBalance); // Get wallet balance
router.get('/history/:user_id', authenticateToken, getTransactionHistory); // Get transaction history

module.exports = router;
