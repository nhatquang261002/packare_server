const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'hold', 'release', 'payment', 'refund'],
      required: true
    },
    status: {
      type: String,
      enum: ['success', 'pending', 'failed'],
      required: true
    },
    transaction_time: {
      type: Date,
      default: Date.now
    }
  });
  
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
