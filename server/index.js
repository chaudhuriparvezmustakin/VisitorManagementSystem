const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const visitorRoutes = require('./routes/visitorRoutes');
const authRoutes = require('./routes/authRoutes');

const User = require('./models/User');

// Load env vars
dotenv.config();

// Connect Database & Auto-Seed Users
connectDB().then(async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('No users found in DB. Auto-seeding default role accounts...');
      await User.create([
        { name: 'System Admin', email: 'admin@company.com', password: 'admin123', role: 'admin' },
        { name: 'Front Desk Receptionist', email: 'reception@company.com', password: 'reception123', role: 'receptionist' },
        { name: 'Gate Security Guard', email: 'security@company.com', password: 'security123', role: 'security' }
      ]);
      console.log('🔑 Default role accounts auto-created (Admin, Receptionist, Security)!');
    }
  } catch (err) {
    console.error('Auto-seed check note:', err.message);
  }
});

const app = express();

// Middleware
// CORS — allow deployed frontend + local dev
const allowedOrigins = [
  'https://visitormanagementsystem-1-csms.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/visitors', visitorRoutes);

// Serve static frontend build in production if present
const path = require('path');
const fs = require('fs');
const clientDistPath = path.join(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Root Health Route (fallback when client build is not present)
  app.get('/', (req, res) => {
    res.json({
      status: 'Active',
      message: 'Employee Visitor Management System API Server',
      timestamp: new Date(),
    });
  });
}

// 404 Route Handler for API endpoints
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found - ${req.originalUrl}`,
  });
});

// Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Visitor Management API Server running on port ${PORT}`);
  console.log(`📍 Endpoint: http://localhost:${PORT}/api/visitors`);
  console.log(`==================================================`);
});
