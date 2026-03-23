const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dns = require('dns');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

// Some environments have DNS resolution issues for SRV records (mongodb+srv).
// Force Node to use a known working DNS resolver (Google DNS) so Atlas SRV lookups succeed.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

const defaultOrigins = ['http://localhost:3000'];
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || defaultOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
};

const server = http.createServer(app);
const io = socketIo(server, {
  cors: corsOptions
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
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_PATH || 'uploads')));

// MongoDB connection
const isTestEnv = process.env.NODE_ENV === 'test';
const mongoUri = isTestEnv
  ? (process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/elearn-test')
  : (process.env.MONGODB_URI || 'mongodb://localhost:27017/elearning');

if (mongoose.connection.readyState === 0) {
  mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));
}

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
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/users', require('./routes/users'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/calendar-events', require('./routes/calendarEvents'));

app.get('/', (req, res) => {
  res.send('eLearning API is running');
});

app.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message || 'Upload failed' });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  console.error(err);
  return res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// Start server
const PORT = process.env.PORT || 5001;
if (!isTestEnv) {
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
}

module.exports = app;