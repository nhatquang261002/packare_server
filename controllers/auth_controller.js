const bcrypt = require('bcrypt');
const Account = require('../models/account_model');
const { hashPassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const { generateAccountID } = require('../utils/generate_id');


// Controller function for user login
const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find account by username
        const account = await Account.findOne({ username });

        // If account not found or password is incorrect
        if (!account || !(await bcrypt.compare(password, account.password))) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Generate JWT token for the authenticated user
        const token = generateToken({ userId: account.account_id });

        // Respond with success message and JWT token
        return res.status(200).json({ message: 'Login successful', account, token });
    } catch (error) {
        console.error('Error logging in: ', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


// Controller function for user signup
const signup = async (req, res) => {
    try {
        const { username, first_name, last_name, phone_number, password } = req.body;

        // Verify if all required fields are present
        if (!username || !first_name || !last_name || !phone_number || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Generate a unique account ID
        const account_id = await generateAccountID();

        // Check if the user or account already exists
        const existingAccount = await Account.findOne({ username });
        if (existingAccount) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create a new account
        const newAccount = new Account({
            account_id: account_id,
            username,
            password: hashedPassword,
        });

        // Save the new account to the database
        await newAccount.save();

        // Create a new user and wallet with the generated account _id
        newAccount.user = {
            user_id: newAccount.account_id,
            first_name,
            last_name,
            phone_number
        };

        newAccount.wallet = {
            user_id: newAccount.account_id,
            balance: 500000,
            transaction_history: []
        };

        // Save the updated account with user and wallet
        await newAccount.save();

        // Return the token along with other response data
        const token = generateToken({ userId: newAccount.account_id });
        res.status(201).json({ message: 'User, account, and wallet created successfully', token, account: newAccount });
    } catch (error) {
        console.error('Error creating user, account, and wallet:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Controller function for shipper signup
const shipperSignup = async (req, res) => {
    try {
        const { username, first_name, last_name, phone_number, password } = req.body;

        // Verify if all required fields are present
        if (!username || !first_name || !last_name || !phone_number || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Generate a unique account ID
        const account_id = await generateAccountID();

        // Check if the user or account already exists
        const existingAccount = await Account.findOne({ username });
        if (existingAccount) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create a new account
        const newAccount = new Account({
            account_id: account_id,
            username,
            password: hashedPassword,
        });

        // Save the new account to the database
        await newAccount.save();

        // Create a new user, shipper, and wallet with the generated account _id
        newAccount.user = {
            user_id: newAccount.account_id,
            first_name,
            last_name,
            phone_number
        };

        newAccount.shipper = {
            shipper_id: newAccount.account_id,
            shipped_orders: [],
            current_orders: [],
            routes: []
        };

        newAccount.wallet = {
            user_id: newAccount.account_id,
            balance: 500000,
            transaction_history: []
        };

        // Save the updated account with user, shipper, and wallet
        await newAccount.save();

        // Return the token along with other response data
        const token = generateToken({ userId: newAccount.account_id });
        res.status(201).json({ message: 'User, account, and wallet created successfully', token, account: newAccount });
    } catch (error) {
        console.error('Error creating shipper account:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { login, signup, shipperSignup };
