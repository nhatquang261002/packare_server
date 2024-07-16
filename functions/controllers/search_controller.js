const Account = require('../models/account_model');
const Order = require('../models/order_model');

// Function to search for accounts or orders
const search = async (req, res) => {
  const { type } = req.params; // 'accounts' or 'orders'
  const { page = 1, limit = 10, sortOrder, searchField, searchQuery } = req.query;
  const offset = (page - 1) * limit;

  try {
    let result;
    let query = {};
    let sortQuery = {};

    // Determine which model to use based on 'type' parameter
    switch (type) {
      case 'accounts':
        if (searchField && searchQuery) {
          query[searchField] = { $regex: new RegExp(searchQuery, 'i') };
        }

        if (sortOrder === 'asc') {
          sortQuery = { created_at: 1 };
        } else if (sortOrder === 'desc') {
          sortQuery = { created_at: -1 };
        }

        result = await Account.find(query)
          .sort(sortQuery)
          .skip(offset)
          .limit(limit);
        break;

      case 'orders':
        if (searchField && searchQuery) {
          query[searchField] = { $regex: new RegExp(searchQuery, 'i') };
        }

        if (sortOrder === 'asc') {
          sortQuery = { create_time: 1 };
        } else if (sortOrder === 'desc') {
          sortQuery = { create_time: -1 };
        }

        result = await Order.find(query)
          .sort(sortQuery)
          .skip(offset)
          .limit(limit);
        break;

      default:
        return res.status(400).json({ message: 'Invalid search type' });
    }

    // Return the array of results with a success message
    return res.status(200).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} fetched successfully`, data: result });
  } catch (error) {
    // Handle errors and return an error message
    console.error(`Error fetching ${type}:`, error);
    return res.status(500).json({ message: `Failed to fetch ${type}`, error });
  }
};

module.exports = { search };
