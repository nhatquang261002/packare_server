const bcrypt = require('bcrypt');
const Account = require('../models/account_model');
const { hashPassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const { generateAccountID } = require('../utils/generate_id');
const jwt = require('jsonwebtoken');
const config = require('../secret_config');

// Controller function for user login with username and password
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

// Controller function for user login with an existing token (cached login)
const loginWithToken = async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token from Authorization header

    if (!token) {
        return res.status(401).json({ message: 'Authentication token is missing' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Find account associated with the token's userId
        const account = await Account.findOne({ account_id: decoded.userId });

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Respond with the account data if token is valid
        return res.status(200).json({ message: 'Login successful with token', account });
    } catch (error) {
        console.error('Error logging in with token:', error);
        return res.status(403).json({ message: 'Invalid or expired token' });
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

// Account fetch function
const getAccountData = async (req, res) => {
    try {
        const accountId = req.user.userId; // Retrieved from the decoded JWT in authenticateToken
        const account = await Account.findOne({ account_id: accountId });

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        res.status(200).json({ account });
    } catch (error) {
        console.error('Error fetching account data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { login, loginWithToken, signup, shipperSignup, getAccountData };
