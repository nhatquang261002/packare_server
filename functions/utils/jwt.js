const jwt = require('jsonwebtoken');
const config = require('../secret_config');

// Function to generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};

module.exports = {generateToken};