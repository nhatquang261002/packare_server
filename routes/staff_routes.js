const express = require('express');
const router = express.Router();
const { 
    getAllUsers, getUsersByRole, getOrdersByStatus, getAllOrders
} = require('../controllers/stats_controller'); // Import controller functions
const { authenticateToken } = require('../middlewares/jwt_verify'); // Import middleware for token authentication
const { checkRole } = require('../middlewares/check_role'); // Import middleware for checking user role

const { login, signup } = require('../controllers/auth_controller');


// Login route for Staff
router.post('/login', /*authenticateToken, checkRole(['admin', 'staff']) ,*/ login);


// Define routes for fetching all users
router.get('/users',  /*authenticateToken, checkRole(['admin', 'staff']) ,*/ getAllUsers);

// Define routes for fetching users by role
router.get('/users/role/:role', /* authenticateToken, checkRole(['admin', 'staff']), */ getUsersByRole);

// Define routes for fetching orders by status
router.get('/orders/status/:status', /* authenticateToken, checkRole(['admin', 'staff']), */ getOrdersByStatus);


// Define routes for fetching shippers
router.get('/orders',  /*authenticateToken, checkRole(['admin', 'staff']),*/  getAllOrders);

module.exports = router;
