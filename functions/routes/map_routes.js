const express = require('express');
const router = express.Router();
const { createRoute, saveRoute, getShipperRoutes, getRouteById, updateRouteById, deleteRouteById } = require('../controllers/map_controller');
const { authenticateToken } = require('../middlewares/jwt_verify');

// Create route
router.post('/create-route', authenticateToken, createRoute);

// Save route
router.post('/save-route', authenticateToken, saveRoute);

// Get route list for a specific shipper
router.get('/shipper/:shipper_id/routes', authenticateToken, getShipperRoutes);

// Get route by ID
router.get('/route/:id/get-route', authenticateToken, getRouteById);

// Update route by ID
router.put('/route/:id/update-route', authenticateToken, updateRouteById);

// Delete route by ID
router.delete('/route/:id/delete-route', authenticateToken, deleteRouteById);

module.exports = router;
