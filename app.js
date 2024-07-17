const express = require('express');
const mongoose = require('./config/db');
const WebSocket = require('ws');
const session = require('./middlewares/session');
const rateLimitMiddleware = require('./middlewares/rate_limit');
const app = express();
const routes = require('./routes/routes');
const config = require('./secret_config');
const RoleSeeder = require('./seeders/role_seeder');
const SettingsSeeder = require('./seeders/settings_seeder');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const http = require('http');
const { handleConnection } = require('./websocket/connection_handler');
const OrderScheduler = require('./middlewares/order_scheduler');


require('dotenv').config();

const port = config.server.port || 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Session middleware 
app.use(session);

// Use rate limiting middleware
app.use(rateLimitMiddleware);

// Use all routes
app.use('/api', routes);

// Seed roles and settings when the application starts
RoleSeeder.seedRoles();
SettingsSeeder.seedSettings();

// Centralized error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.use(cors());

// Proxy requests to the backend server
app.use('/api', createProxyMiddleware({ target: 'http://192.168.138.133:8080', changeOrigin: true }));

// Start the HTTP server
const server = http.createServer(app);
server.listen(port, () => {
  console.log(`HTTP server is running on port ${port}`);
});

OrderScheduler.startOrderCancellationScheduler();

// Create a WebSocket server instance
const wss = new WebSocket.Server({ server, path: '/ws' });

// Log to confirm WebSocket server initialization
wss.on('listening', () => {
  console.log('WebSocket server is listening on port 8443');
});

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  handleConnection(ws, req); // Pass the WebSocket and req objects to handleConnection function
});
