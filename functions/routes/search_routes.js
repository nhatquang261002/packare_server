const express = require('express');
const router = express.Router();
const { search } = require('../controllers/search_controller');

// Route for searching accounts
router.get('/accounts', (req, res) => {
  req.params.type = 'accounts';
  search(req, res);
});

// Route for searching orders
router.get('/orders', (req, res) => {
  req.params.type = 'orders';
  search(req, res);
});

module.exports = router;
