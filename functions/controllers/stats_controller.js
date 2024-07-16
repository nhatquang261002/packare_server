const Account = require('../models/account_model'); // Import the Account model
const Order = require('../models/order_model');

// Function to fetch all users with optional sorting
const getAllUsers = async (req, res) => {
  const { page = 1, limit = 10, sortOrder } = req.query; // Default to page 1, 10 users per page, and no sort
  const offset = (page - 1) * limit;

  try {
    // Define sorting order for createdAt if sort parameter is provided
    let sortQuery = {};
    if (sortOrder === 'asc') {
      sortQuery = { created_at: 1 };
    } else if (sortOrder === 'desc') {
      sortQuery = { created_at: -1 };
    }

    // Query the Account collection with pagination and optional sorting
    const users = await Account.find({})
      .sort(sortQuery)
      .skip(offset)
      .limit(limit);
 
    // Return the array of users with a success message
    return res.status(200).json({ message: 'Users fetched successfully', data: users });
  } catch (error) {
    // Handle errors and return an error message
    console.error('Error fetching users:', error);
    return res.status(500).json({ message: 'Failed to fetch users', error });
  }
};

// Function to fetch users by role with optional sorting
const getUsersByRole = async (req, res) => {
  const { role } = req.params; // Get the role from params
  const { page = 1, limit = 10, sortOrder } = req.query; // Default to page 1, 10 users per page, and no sort
  const offset = (page - 1) * limit;

  try {
    // Define sorting order for createdAt if sort parameter is provided
    let sortQuery = {};
    if (sortOrder === 'asc') {
      sortQuery = { created_at: 1 };
    } else if (sortOrder === 'desc') {
      sortQuery = { created_at: -1 };
    }

    // Query the Account collection to find documents with the specified role, paginate, and optional sorting
    const users = await Account.find({ rolename: role })
      .sort(sortQuery)
      .skip(offset)
      .limit(limit);

    // Return the array of users with a success message
    return res.status(200).json({ message: `Users with role '${role}' fetched successfully`, data: users });
  } catch (error) {
    // Handle errors and return an error message
    console.error(`Error fetching ${role}s:`, error);
    return res.status(500).json({ message: `Failed to fetch ${role}s`, error });
  }
};

// Function to fetch orders by status with optional sorting
const getOrdersByStatus = async (req, res) => {
  const { status } = req.params; // Get the status from params
  const { page = 1, limit = 10, sortOrder } = req.query; // Default to page 1, 10 orders per page, and no sort
  const offset = (page - 1) * limit;

  try {
    // Define sorting order for createdAt if sort parameter is provided
    let sortQuery = {};
    if (sortOrder === 'asc') {
      sortQuery = { create_time: 1 };
    } else if (sortOrder === 'desc') {
      sortQuery = { create_time: -1 };
    }

    // Query the Order collection to find documents with the specified status, paginate, and optional sorting
    const orders = await Order.find({ status: status })
      .sort(sortQuery)
      .skip(offset)
      .limit(limit);

    // Return the array of orders with a success message
    return res.status(200).json({ message: `Orders with status '${status}' fetched successfully`, data: orders });
  } catch (error) {
    // Handle errors and return an error message
    console.error(`Error fetching orders with status '${status}':`, error);
    return res.status(500).json({ message: `Failed to fetch orders with status '${status}'`, error });
  }
};

// Function to fetch all orders with optional sorting
const getAllOrders = async (req, res) => {
  const { page = 1, limit = 10, sortOrder } = req.query; // Default to page 1, 10 orders per page, and no sort
  const offset = (page - 1) * limit;

  try {
    // Define sorting order for createdAt if sort parameter is provided
    let sortQuery = {};
    if (sortOrder === 'asc') {
      sortQuery = { create_time: 1 };
    } else if (sortOrder === 'desc') {
      sortQuery = { create_time: -1 };
    }

    // Query the Order collection with pagination and optional sorting
    const orders = await Order.find({})
      .sort(sortQuery)
      .skip(offset)
      .limit(limit);

    // Return the array of orders with a success message
    return res.status(200).json({ message: 'Orders fetched successfully', data: orders });
  } catch (error) {
    // Handle errors and return an error message
    console.error('Error fetching orders:', error);
    return res.status(500).json({ message: 'Failed to fetch orders', error });
  }
};

module.exports = { getAllUsers, getUsersByRole, getOrdersByStatus, getAllOrders };
