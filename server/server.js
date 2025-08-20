/* server.js */
// Try loading env from server/.env first; if server is started from project root, also attempt parent .env
require('dotenv').config();
try { require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') }); } catch (_) {}
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const WebSocket = require('ws');
const { setupSpeechRecognition, isSpeechConfigured } = require('./config/speechService');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/problems', require('./routes/problems'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/tts', require('./routes/tts'));
app.use('/api/qna', require('./routes/qna'));

// Quick health/debug endpoints
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'AceAI Backend API is running!' });
});

const DEFAULT_PORT = Number(process.env.PORT) || 5001;

// Create a WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('WebSocket connection established');
  setupSpeechRecognition(ws);
});

// Attempt to bind the HTTP server, with fallback when the port is in use
function startServer(port, attemptsLeft = 5) {
	const server = app.listen(port, () => {
		console.log(`Server is running on port ${port}`);
		if (!isSpeechConfigured) {
			console.warn('Azure Speech keys not set. WebSocket speech recognition will be disabled.');
		}
	});

	server.on('error', (err) => {
		if (err && err.code === 'EADDRINUSE' && attemptsLeft > 0) {
			const nextPort = port + 1;
			console.warn(`Port ${port} is in use. Retrying on port ${nextPort}...`);
			startServer(nextPort, attemptsLeft - 1);
			return;
		}
		console.error('Failed to start server:', err);
		process.exit(1);
	});

	// Upgrade HTTP server to handle WebSocket connections
	server.on('upgrade', (request, socket, head) => {
		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit('connection', ws, request);
		});
	});
}

startServer(DEFAULT_PORT);
