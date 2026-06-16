const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { testConnection, pool } = require('./config/db');
const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const learnerRoutes = require('./routes/learners');
const gradeRoutes = require('./routes/grades');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'], credentials: true }
});

// Make io accessible in routes
app.set('io', io);

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/learners', learnerRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: '✅ Running' }));

// Socket.io — real-time
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  socket.on('register_user', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.join(`user_${userId}`);
    console.log(`👤 User ${userId} registered on socket`);
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) { connectedUsers.delete(userId); break; }
    }
  });
});

app.set('connectedUsers', connectedUsers);

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  await testConnection();
  console.log(`🚀 Server running on port ${PORT}`);
});