const Account = require("../models/account_model");

const checkRole = (roles) => {
    return async (req, res, next) => {
        // Ensure that the user object is set by the authenticateToken middleware
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        try {
            const account = await Account.findOne({ 'account_id': req.user.userId});

            if (!account) {
                return res.status(404).json({ message: 'Account not found' });
            }

            if (!roles.includes(account.rolename)) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            next();
        } catch (error) {
            console.error('Error checking role:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    };
};

module.exports = {
    checkRole
};
