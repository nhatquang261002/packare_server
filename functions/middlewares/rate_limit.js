const rateLimit = require("express-rate-limit");

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 100000, // limit each IP to 100000 requests per windowMs
  message: "Too many requests, please try again later."
});

module.exports = limiter;
