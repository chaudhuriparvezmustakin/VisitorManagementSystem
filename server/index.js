const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const visitorRoutes = require('./routes/visitorRoutes');
const authRoutes = require('./routes/authRoutes');

// Load env vars
dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/visitors', visitorRoutes);

// Root Health Route
app.get('/', (req, res) => {
  res.json({
    status: 'Active',
    message: 'Employee Visitor Management System API Server',
    timestamp: new Date(),
  });
});

// 404 Route Handler
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
