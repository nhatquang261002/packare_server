const express = require('express');
const router = express.Router();
const { getAllSettings, updateSetting } = require('../controllers/settings_controller');
const { login, signup } = require('../controllers/auth_controller');

// Login route for Admin
router.post('/login', /*authenticateToken, checkRole(['admin']) ,*/ login);

// Route to get all settings
router.get('/settings', /*authenticateToken, checkRole(['admin']) ,*/getAllSettings);

// Route to update a setting
router.put('/settings/:key', /*authenticateToken, checkRole(['admin']) ,*/updateSetting);

module.exports = router;
