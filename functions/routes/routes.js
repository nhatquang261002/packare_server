const express = require('express');
const router = express.Router();
const rateLimit = require("express-rate-limit");

// Import routes for each role
const authRoutes = require('./auth_routes');
const userRoutes = require('./user_routes');
const shipperRoutes = require('./shipper_routes');
const orderRoutes = require('./order_routes');
const mapRoutes = require('./map_routes');
const roleRoutes = require('./role_routes');  // Import the role routes
const staffRoutes = require('./staff_routes');
const adminRoutes = require('./admin_routes');
const searchRoutes = require('./search_routes');
const mockRoutes = require('./mock_routes');


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
router.use(limiter);

// Define route groups based on role and resource

// Mock routes
router.use('/mock', mockRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// User routes
router.use('/user', userRoutes);

// Shipper routes
router.use('/shipper', shipperRoutes);

// Order routes
router.use('/order', orderRoutes);

// Map routes
router.use('/map', mapRoutes);

// Role routes
router.use('/role', roleRoutes);

// Staff routes
router.use('/staff', staffRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Search routes
router.use('/search', searchRoutes);

// Centralized error handling
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = router;
