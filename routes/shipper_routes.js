const express = require('express');
const router = express.Router();
const { updateShipperMaxDistance, recommendOrderForShipper, getCurrentOrders } = require('../controllers/shipper_controller');
const { authenticateToken } = require('../middlewares/jwt_verify');
const { checkRole } = require('../middlewares/check_role');
const { login, shipperSignup, loginWithToken } = require('../controllers/auth_controller');

// Login route for Shipper
router.post('/login', login);

// Login with token route for Shipper
router.post('/login-with-token', loginWithToken);


// Signup route for Shipper
router.post('/signup', shipperSignup);

// Config Max Distance the Shipper want to have Orders
router.put('/max-distance/:id', authenticateToken, checkRole(['admin', 'staff', 'shipper']), updateShipperMaxDistance);

// Recommend Orders for Shipper
router.post('/recommend-orders', authenticateToken, checkRole(['admin', 'staff', 'shipper']), recommendOrderForShipper);

// Get Current Orders for Shipper
router.get('/current-orders/:id', authenticateToken, checkRole(['admin', 'staff', 'shipper']), getCurrentOrders);

module.exports = router;
