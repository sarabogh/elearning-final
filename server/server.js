const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dns = require('dns');
const jwt = require('jsonwebtoken');

dotenv.config();

// Some environments have DNS resolution issues for SRV records (mongodb+srv).
// Force Node to use a known working DNS resolver (Google DNS) so Atlas SRV lookups succeed.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

io.use((socket, next) => {
  const token = socket.handshake?.auth?.token;
  if (!token) {
    socket.user = null;
    return next();
  }

  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return next(new Error('Authentication error'));
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_PATH || 'uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

app.set('io', io);

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  if (socket.user?.id) {
    socket.join(`user-${socket.user.id}`);
  }

  socket.on('joinChat', (chatId) => {
    if (!chatId) return;
    const roomId = `chat-${chatId}`;
    socket.join(roomId);
  });

  socket.on('leaveChat', (chatId) => {
    if (!chatId) return;
    const roomId = `chat-${chatId}`;
    socket.leave(roomId);
  });

  // Backward compatibility with old course room event names.
  socket.on('joinRoom', (roomId) => {
    if (roomId) {
      socket.join(roomId);
    }
  });

  socket.on('chatMessage', (data) => {
    if (data?.roomId) {
      io.to(data.roomId).emit('message', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/users', require('./routes/users'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/calendar-events', require('./routes/calendarEvents'));

app.get('/', (req, res) => {
  res.send('eLearning API is running');
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Make sure no other server is running on this port.`);
  } else {
    console.error('Server error:', err);
  }
});