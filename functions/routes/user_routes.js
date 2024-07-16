const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/jwt_verify');
const { getUserProfile, updateUserProfile, changePassword, getNotifications } = require('../controllers/user_controller');

// User routes
router.get('/:userId/get-profile', /*authenticateToken,*/ getUserProfile);                    // Get user profile
router.put('/profile/update', authenticateToken, updateUserProfile);              // Update user profile
router.put('/profile/change-password', authenticateToken, changePassword);        // Change user password
router.get('/:userId/get-notifications', authenticateToken, getNotifications);     // Get notifications for a user

module.exports = router;
