const WebSocket = require('ws');
const { addUserToOrderTracking, removeUserFromOrderTracking } = require('./websocket_config');
const Order = require('../models/order_model');
const { orderTracking, userConnections } = require('./websocket_config');

// Function to send shipper location updates from shipper
function sendShipperLocation(orderId, shipperId, latitude, longitude) {
    try {
        const message = JSON.stringify({
            type: 'shipper-location-update',
            orderId,
            shipperId,
            latitude,
            longitude
        });

        if (orderTracking.has(orderId)) {
            const shipperTracking = orderTracking.get(orderId);
            if (shipperTracking.has(shipperId)) {
                const userTracking = shipperTracking.get(shipperId);
                userTracking.forEach((ws, userId) => {
                    if (userConnections.has(userId)) {
                        const wsSet = userConnections.get(userId);
                        wsSet.forEach((ws) => {
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(message);
                                console.log(`Shipper location update sent via WebSocket to user ${userId}`);
                            } else {
                                console.error(`User WebSocket connection is not open for user ${userId}`);
                            }
                        });
                    } else {
                        console.error(`No WebSocket connection found for user ${userId}`);
                    }
                });
            } else {
                console.error(`No users subscribed to shipper location updates for shipper ${shipperId} and order ${orderId}`);
            }
        } else {
            console.error(`No users subscribed to shipper location updates for order ${orderId}`);
        }
        
        
    } catch (error) {
        console.error('Error sending shipper location update:', error);
    }
}

// Function to handle subscription and track shipper location updates
async function trackShipperLocation(ws, data) {
    try {
        const { orderId, userId } = data;

        // Fetch the order from the database
        const order = await Order.findOne({ order_id: orderId });

        if (!order) {
            console.error(`Order with ID ${orderId} not found`);
            return;
        }

        // Check if the sender WebSocket connection is authorized to subscribe to shipper location updates
        if (order.sender_id !== userId) {
            console.error(`Unauthorized access: Sender with ID ${userId} is not authorized to subscribe to shipper location updates for order ${orderId}`);
            return;
        }

        // Add the sender's WebSocket connection to tracking for the specified order
        addUserToOrderTracking(orderId, order.shipper_id, userId, ws);

        console.log(`User with ID ${userId} subscribed to shipper handling order ${orderId} location updates`);
    } catch (error) {
        console.error('Error tracking shipper location:', error);
    }
}

// Function to handle shipper canceling location sharing for a specific order
function cancelShipperLocationSharing(ws, data) {
    try {
        const { orderId, shipperId } = data;

        // Remove the shipper's WebSocket connection from tracking for the specified order
        removeUserFromOrderTracking(orderId, shipperId, null);

        console.log(`Shipper with ID ${shipperId} canceled location sharing for order ${orderId}`);
    } catch (error) {
        console.error('Error canceling shipper location sharing:', error);
    }
}

// Function to remove the userId from orderTracking for the given orderId and shipperId
function removeUserIdFromOrderTracking(orderId, shipperId) {

    console.log(orderTracking);
    // Check if the orderId exists in the orderTracking map
    if (orderTracking.has(orderId)) {
        // Get the shipperTracking map for the orderId
        const shipperTracking = orderTracking.get(orderId);

        // Check if the shipperId exists in the shipperTracking map
        if (shipperTracking.has(shipperId)) {
            // Remove the userId from the userTracking set
            shipperTracking.clear();
            console.log('Removed user tracking for order ${orderId}');
        } else {
            console.error(`No users subscribed to shipper location updates for shipper ${shipperId} at order ${orderId}`);
        }
    } else {
        console.error(`No users subscribed to shipper location updates for order ${orderId}`);
    }
}



module.exports = { sendShipperLocation, trackShipperLocation, cancelShipperLocationSharing, removeUserIdFromOrderTracking };
