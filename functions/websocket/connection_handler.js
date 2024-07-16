const WebSocket = require('ws');
const { addUserConnection, removeUserConnection, userConnections } = require('./websocket_config');
const { trackShipperLocation, sendShipperLocation, removeUserIdFromOrderTracking } = require('./shipper_location');
const { handleNotification, sendOrderStatusNotification, deliverOfflineNotifications } = require('./notification_service');

// Set a timeout duration for detecting lost connections
const connectionTimeout = 15000; // 15 seconds

// Function to send a heartbeat ping to WebSocket clients
function sendHeartbeat(ws) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
    }
}

// Function to start heartbeat after receiving the userId
function startHeartbeat(ws, timeout) {
    console.log('Client ' + ws.userId + ' connected');
    clearTimeout(timeout); // Clear the initial timeout

    // Set up an interval to send heartbeat pings to WebSocket clients every 5 seconds
    const heartbeatInterval = setInterval(() => {
        sendHeartbeat(ws);
    }, 5000);

    // Event handler for closing the WebSocket connection
    ws.on('close', function close() {
        console.log('Client disconnected');
        clearInterval(heartbeatInterval); // Clear the heartbeat interval
    });
}

// Set up an interval to send heartbeat pings to WebSocket clients every 5 seconds
setInterval(() => {
    userConnections.forEach(wsSet => {
        wsSet.forEach(ws => {
            sendHeartbeat(ws);
        });
    });
}, 5000);

// Function to handle WebSocket connections
function handleConnection(ws, req) {
    // Set a timeout to detect lost connections
    const timeout = setTimeout(() => {
        console.log('Connection lost');
        ws.terminate(); // Terminate the connection
    }, connectionTimeout);

    // Event handler for 'open' event on the WebSocket connection
    ws.on('open', function open() {
        console.log('WebSocket connection is open and ready.');
    });

    // Event handler for receiving messages from clients
    ws.on('message', async function incoming(message) {

        try {
            const data = JSON.parse(message);

            // Check if it's a user-id message
            if (data.type === 'user-id') {
                // Extract userId from the message
                const userId = data.userId;
                ws.userId = userId; // Set the userId once received from the client
                addUserConnection(ws.userId, ws); // Add the WebSocket to user connections
                startHeartbeat(ws, timeout); // Start heartbeat after receiving the userId

                // Deliver offline notifications when the user reconnects
                await deliverOfflineNotifications(userId);
            } else {
                // Handle other message types
                switch (data.type) {
                    case 'subscribe-shipper-location':
                        trackShipperLocation(ws, data);
                        break;
                    case 'unsubscribe-shipper-location':
                        removeUserIdFromOrderTracking(data.orderId, data.shipperId);
                        break;
                    case 'notification':
                        // Handle notification messages
                        await handleNotification(ws, data);
                        break;
                    case 'shipper-location-update':
                        // Send shipper location updates
                        sendShipperLocation(data.orderId, data.shipperId, data.latitude, data.longitude);
                        break;
                    case 'cancel-shipper-location-sharing':
                        cancelShipperLocationSharing(ws, data);
                        break;
                    case 'pong':
                        // Reset the connection timeout when pong is received
                        clearTimeout(timeout);
                        break;
                    default:
                        console.log('Unknown message type:', data.type);
                }
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    // Event handler for closing connections
    ws.on('close', function close() {
        console.log('Client disconnected');

        // Remove the WebSocket from user connections
        const userId = ws.userId;
        if (userConnections.has(userId)) {
            removeUserConnection(userId, ws);
        }

        clearTimeout(timeout); // Clear the timeout
    });
}

module.exports = { handleConnection };
