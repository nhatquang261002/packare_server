const express = require('express');
const router = express.Router();
const { checkRole } = require('../middlewares/check_role');
const { authenticateToken } = require('../middlewares/jwt_verify');

const {
    createOrder,
    orderFeedback,
    acceptOrder,
    verifyOrder,
    declineOrder,
    confirmPickup,
    confirmDelivered,
    completeOrder,
    viewOrderHistory,
    cancelOrder,
    updatePackage,
    deletePackage,
    getOrderPackages,
    getOrderById,
    getOrdersByUser,
    calculateShippingPrice,
    startShipping // Add the import for the startShipping function
} = require('../controllers/order_controller');

// Create new Order
router.post('/create-order', authenticateToken, createOrder);

// Feedback Order
router.post('/:id/feedback', authenticateToken, orderFeedback);

// Accept Order
router.put('/:id/accept',  authenticateToken, checkRole(['admin', 'shipper']), acceptOrder);

// Decline verify Order from Staff
router.put('/:id/decline',   declineOrder);

// Verify the Order from staff
router.put('/:id/verify',   verifyOrder);

// Cancel Order
router.put('/:id/cancel', authenticateToken, cancelOrder);

// Confirm picked up the Order from shipper
router.put('/:id/confirm-pickup', authenticateToken, checkRole(['admin', 'shipper']), confirmPickup);

// Confirm delivered from shipper
router.put('/:id/confirm-delivered', authenticateToken, checkRole(['admin', 'shipper']), confirmDelivered);

// Confirm complete Order from shipper
router.put('/:id/complete', authenticateToken, checkRole(['admin', 'shipper']), completeOrder);

// Get the Orders History from User
router.get('/history', authenticateToken, viewOrderHistory);

// Get Order by ID
router.get('/:id', /* authenticateToken, */ getOrderById);

// Get Order's Packages
router.get('/:id/packages', authenticateToken, getOrderPackages);

// Update Order's Package by Id
router.put('/:orderId/packages/:packageId/update', authenticateToken, updatePackage);

// Delete Order's Package by Id
router.delete('/:orderId/packages/:packageId/delete', authenticateToken, deletePackage);

// Get Orders by User
router.get('/user/:user_id', authenticateToken, getOrdersByUser); 

// Calculate Shipping Price
router.post('/calculate-shipping-price', authenticateToken, calculateShippingPrice);

// Start shipping an order
router.put('/:id/start-shipping', authenticateToken, checkRole(['admin', 'shipper']), startShipping);

module.exports = router;
