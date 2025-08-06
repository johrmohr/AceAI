/* server.js */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const WebSocket = require('ws');
const { setupSpeechRecognition } = require('./config/speechService');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/problems', require('./routes/problems'));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'AceAI Backend API is running!' });
});

const PORT = process.env.PORT || 5001;

// Create a WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('WebSocket connection established');
  setupSpeechRecognition(ws);
});

// Upgrade HTTP server to handle WebSocket connections
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
