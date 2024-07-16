const Wallet = require('../models/wallet_model');
const Transaction = require('../models/transaction_model');

// Create a new payment (transaction + wallet update)
const createPayment = async (req, res) => {
    try {
        const { user_id, amount, type } = req.body;

        // Check if the user has a wallet
        let wallet = await Wallet.findOne({ user_id: user_id });
        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found for this user' });
        }

        // Create a new transaction
        const transaction = new Transaction({
            type: type,
            status: 'pending'
        });

        // Save the transaction
        await transaction.save();

        // Update the wallet balance based on transaction type
        switch (type) {
            case 'deposit':
                wallet.balance += amount;
                break;
            case 'withdrawal':
                if (wallet.balance < amount) {
                    return res.status(400).json({ message: 'Insufficient funds' });
                }
                wallet.balance -= amount;
                break;
            case 'hold':
                if (wallet.balance < amount) {
                    return res.status(400).json({ message: 'Insufficient funds' });
                }
                wallet.balance -= amount;
                break;
            case 'release':
                wallet.balance += amount;
                break;
            default:
                return res.status(400).json({ message: 'Invalid transaction type' });
        }

        wallet.transaction_history.push(transaction._id);
        await wallet.save();

        // Update the transaction status
        transaction.status = 'success';
        await transaction.save();

        res.status(201).json({ message: 'Payment successful', transaction });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { createPayment };
