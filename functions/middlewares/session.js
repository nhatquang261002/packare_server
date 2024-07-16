const session = require('express-session');
const config = require('../secret_config');

const sessionMiddleware = session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: true
});

module.exports = sessionMiddleware;
