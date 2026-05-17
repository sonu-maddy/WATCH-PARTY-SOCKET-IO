const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const registerSocketEvents = require('./socket/events');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:21017/watchparty';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// HTTP Base Route
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Watch Party Robust Backend Running' });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  registerSocketEvents(io, socket);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});