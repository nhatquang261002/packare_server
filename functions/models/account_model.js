const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isSent: {
        type: Boolean,
        default: false
    },
    isRead: {
        type: Boolean,
        default: false
    }
});

const userSchema = new mongoose.Schema({
    _id: false,
    user_id: {
        type: String,
        required: true,
        index: true,
        ref: 'Account'
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    phone_number: {
        type: String,
        required: true
    },
    order_history: [{
        type: String,
        ref: 'Order'
    }],
    notifications: [notificationSchema]
});

const shipperSchema = new mongoose.Schema({
    _id: false,
    shipper_id: {
        type: String,
        required: true,
        index: true,
        ref: 'Account'
    },
    shipped_orders: [{
        type: String,
        ref: 'Order',
    }],
    current_orders: [{
        type: String,
        ref: 'Order',
    }],
    routes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
    }],
    max_distance_allowance: {
        type: Number,
        default: 2,
    },
    notifications: [notificationSchema]
});

const walletSchema = new mongoose.Schema({
    _id: false,
    user_id: {
        type: String,
        ref: 'Account',
        unique: true,
        required: true
    },
    balance: {
        type: Number,
        required: true
    },
    transaction_history: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }]
});


const accountSchema = new mongoose.Schema({
    account_id: {
        type: String,
        required: true,
        index: true,
        primaryKey: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    rolename: {
        type: String,
        ref: 'Role',
        default: 'user'
    },
    password: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        required: true,
        default: Date.now
    },
    user: userSchema, 
    shipper: shipperSchema, 
    wallet: walletSchema 
});

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
