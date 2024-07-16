const WebSocket = require('ws');
const { userConnections } = require('./websocket_config');
const Account = require('../models/account_model');

// Function to send order status notification to a user
async function sendOrderStatusNotification(userId, orderId, status) {
    try {
        const user = userConnections.get(userId);
        const timestamp = new Date();
        const message = JSON.stringify({
            type: 'order-status-notification',
            orderId,
            status,
            timestamp // Add timestamp to the message
        });

        // Create notification object
        const notification = {
            title: 'Order Status Update',
            content: `Your order ${orderId} is now ${status}`,
            timestamp,
            isSent: true, // Since this notification is being sent immediately
            isRead: false
        };

        // Save notification to user's notifications array
        await Account.findOneAndUpdate(
            { account_id: userId },
            { $push: { 'user.notifications': notification } }
        );

        // Send notification if user is online
        if (user && user.readyState === WebSocket.OPEN) {
            user.send(message);
        }
    } catch (error) {
        console.error('Error sending order status notification:', error);
    }
}

// Function to deliver offline notifications to a user when they reconnect
async function deliverOfflineNotifications(userId) {
    try {
        if (offlineNotifications.has(userId)) {
            const user = userConnections.get(userId);
            const notifications = offlineNotifications.get(userId);
            notifications.forEach(async notification => {
                if (user && user.readyState === WebSocket.OPEN) {
                    user.send(notification);
                }
            });
            // Update isSent field of notifications to true
            await Account.findOneAndUpdate(
                { account_id: userId },
                { $set: { 'user.notifications.$[].isSent': true } }
            );
            // Clear offline notifications after delivering
            offlineNotifications.delete(userId);
        }
    } catch (error) {
        console.error('Error delivering offline notifications:', error);
    }
}

module.exports = { sendOrderStatusNotification, deliverOfflineNotifications };
