const jwt = require('jsonwebtoken');
const Account = require('../models/account_model');
const config = require('../secret_config');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token is missing' });
    }

    jwt.verify(token, config.jwt.secret, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }

        try {
            const account = await Account.findOne({ account_id: decoded.userId });

            if (!account) {
                return res.status(404).json({ message: 'Account not found' });
            }

            req.user = {
                userId: decoded.userId,
                rolename: account.rolename
            };

            next();
        } catch (error) {
            console.error('Error authenticating user:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
};

module.exports = { authenticateToken };
