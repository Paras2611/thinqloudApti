const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { setupSocket } = require('./socket/liveMonitor');
const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const questionRoutes = require('./routes/questionRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const logRoutes = require('./routes/logRoutes');
const candidateManagerRoutes = require('./routes/candidateManagerRoutes');
const { autoSeed } = require('./seed');

const app = express();
const server = http.createServer(app);

// CORS configuration (PRD SEC-006)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Helmet security headers (PRD SEC-008)
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
setupSocket(io);
app.set('io', io);

// Health check endpoint for Render uptime monitoring (PRD 10.2 / 10.3)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/sessions', sessionRoutes);
app.use('/api/admin/questions', questionRoutes);
app.use('/api/admin/candidates', candidateManagerRoutes);
app.use('/api/admin/logs', logRoutes);
app.use('/api/candidate', candidateRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 Thinqloud Aptitude API running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
  // Auto-seed admin credentials and sample VQAR question bank
  await autoSeed();
});
