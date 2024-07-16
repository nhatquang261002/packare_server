// Store mapping of orders to their tracking users
const orderTracking = new Map();

// Function to add a user to tracking for a specific order
function addUserToOrderTracking(orderId, shipperId, userId, ws) {
    if (!orderTracking.has(orderId)) {
        orderTracking.set(orderId, new Map());
    }
    const shipperTracking = orderTracking.get(orderId);
    if (!shipperTracking.has(shipperId)) {
        shipperTracking.set(shipperId, new Map());
    }
    const userTracking = shipperTracking.get(shipperId);
    if (userId !== null) {
        if (!userTracking.has(userId)) {
            userTracking.set(userId, new Set());
        }
        userTracking.get(userId).add(ws);
    } else {
        userTracking.clear();
    }
}

// Function to remove a user from tracking for a specific order
function removeUserFromOrderTracking(orderId, shipperId, userId, ws) {
    if (orderTracking.has(orderId)) {
        const shipperTracking = orderTracking.get(orderId);
        if (shipperTracking.has(shipperId)) {
            const userTracking = shipperTracking.get(shipperId);
            if (userId !== null) {
                if (userTracking.has(userId)) {
                    userTracking.get(userId).delete(ws);
                    if (userTracking.get(userId).size === 0) {
                        userTracking.delete(userId);
                    }
                }
            } else {
                userTracking.clear();
            }
            if (userTracking.size === 0) {
                shipperTracking.delete(shipperId);
            }
            if (shipperTracking.size === 0) {
                orderTracking.delete(orderId);
            }
        }
    }
}

// Store mapping of users to their WebSocket connections
const userConnections = new Map();

// Function to add a WebSocket connection for a user
function addUserConnection(userId, ws) {
    if (!userConnections.has(userId)) {
        userConnections.set(userId, new Set());
    }
    userConnections.get(userId).add(ws);
}

// Function to remove a WebSocket connection for a user
function removeUserConnection(userId, ws) {
    if (userConnections.has(userId)) {
        userConnections.get(userId).delete(ws);
        if (userConnections.get(userId).size === 0) {
            userConnections.delete(userId);
        }
    }
}

module.exports = { orderTracking, addUserToOrderTracking, removeUserFromOrderTracking, userConnections, addUserConnection, removeUserConnection };
