const Order = require('../models/order_model');
const Account = require('../models/account_model');


// Define a function to generate a unique account ID
const generateAccountID = async () => {
    let uniqueID = '';
    let isUnique = false;

    // Keep generating IDs until a unique one is found
    while (!isUnique) {
        // Generate a new account ID
        const timestamp = Date.now().toString(36);
        const randomChars = Math.random().toString(36).substring(2, 8);
        uniqueID = timestamp + randomChars;

        // Check if any account already exists with this ID
        const existingAccount = await Account.findOne({ account_id: uniqueID });

        // If no account found, set isUnique to true
        if (!existingAccount) {
            isUnique = true;
        }
    }

    return uniqueID.toUpperCase();
};

// Function to generate a user-friendly order ID
const generateOrderID = async () => {
    let uniqueID = '';
    let isUnique = false;

    // Keep generating IDs until a unique one is found
    while (!isUnique) {
        // Generate a new order ID
        const prefix = 'ORD-';
        const timestamp = new Date().getTime(); // Current timestamp in milliseconds
        const uniqueIdentifier = Math.random().toString(36).substring(2, 8); // Random string of 6 characters
        uniqueID = prefix + timestamp + '-' + uniqueIdentifier;

        // Check if any order already exists with this ID
        const existingOrder = await Order.findOne({ order_id: uniqueID });

        // If no order found, set isUnique to true
        if (!existingOrder) {
            isUnique = true;
        }
    }

    return uniqueID.toUpperCase();
};

module.exports = { generateAccountID, generateOrderID };
