const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supersecret_visitor_management_jwt_key_2026',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (or Admin)
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email.',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'receptionist',
    });

    if (user) {
      res.status(201).json({
        success: true,
        message: 'User registered successfully!',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials (User not found)',
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials (Password incorrect)',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Seed default role users (Admin, Receptionist, Security Guard)
// @route   POST /api/auth/seed-users
// @access  Public
const seedUsers = async (req, res) => {
  try {
    // Delete existing users to ensure clean slate if needed
    await User.deleteMany({});

    const defaultUsers = [
      {
        name: 'System Admin',
        email: 'admin@company.com',
        password: 'admin123',
        role: 'admin',
      },
      {
        name: 'Front Desk Receptionist',
        email: 'reception@company.com',
        password: 'reception123',
        role: 'receptionist',
      },
      {
        name: 'Gate Security Guard',
        email: 'security@company.com',
        password: 'security123',
        role: 'security',
      },
    ];

    const users = [];
    for (const u of defaultUsers) {
      const created = await User.create(u);
      users.push({
        _id: created._id,
        name: created.name,
        email: created.email,
        role: created.role,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Default role users created successfully!',
      accounts: [
        { role: 'admin', email: 'admin@company.com', password: 'admin123' },
        { role: 'receptionist', email: 'reception@company.com', password: 'reception123' },
        { role: 'security', email: 'security@company.com', password: 'security123' },
      ],
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to seed users',
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  seedUsers,
};
