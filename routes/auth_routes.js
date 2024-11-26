const express = require('express');
const router = express.Router();
const { login, signup, loginWithToken } = require('../controllers/auth_controller');

// Login route
router.post('/login', login);

// Login token route
router.post('/login-with-token', loginWithToken);

// Signup route
router.post('/signup', signup);

module.exports = router;