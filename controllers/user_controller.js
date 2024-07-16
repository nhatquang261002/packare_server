const Account = require('../models/account_model');
const bcrypt = require('bcrypt');
const { hashPassword } = require('../utils/hash');

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const id = req.params.userId;
        const account = await Account.findOne({account_id: id});
        
        if (!account || !account.user) {
            console.error('User not found. ID:', id); // Log the ID that was used
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'Get Account Successful',
           account: account
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const { first_name, last_name, phone_number } = req.body;

        const updatedAccount = await Account.findOneAndUpdate(
            { account_id: req.user.userId },
            { 'user.first_name': first_name, 'user.last_name': last_name, 'user.phone_number': phone_number },
            { new: true }
        );

        if (!updatedAccount || !updatedAccount.user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = updatedAccount.user;

        res.status(200).json({ message: 'User profile updated successfully', user });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Change user password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const account = await Account.findOne({account_id: req.user.userId});
        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, account.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash the new password
        const hashedPassword = await hashPassword(newPassword);

        // Update the account password
        await Account.findOneAndUpdate(
            { account_id: req.user.userId },
            { password: hashedPassword },
            { new: true }
        );

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get notifications for a user
const getNotifications = async (req, res) => {
    try {
        const userId = req.params.userId;
        const account = await Account.findOne({ account_id: userId });

        if (!account || !account.user || !account.user.notifications) {
            console.error('User notifications not found. User ID:', userId);
            return res.status(404).json({ message: 'User notifications not found' });
        }

        const notifications = account.user.notifications;
        res.status(200).json({ notifications });
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { getUserProfile, updateUserProfile, changePassword, getNotifications };

