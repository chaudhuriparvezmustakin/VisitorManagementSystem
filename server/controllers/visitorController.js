const Visitor = require('../models/Visitor');

// @desc    Get all visitors with search & filter
// @route   GET /api/visitors
// @access  Public
const getVisitors = async (req, res) => {
  try {
    const { search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let query = {};

    // Filter by status if provided and not 'all'
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search by name or mobile number (or organization / person to meet)
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { visitorName: searchRegex },
        { mobileNumber: searchRegex },
        { organization: searchRegex },
        { personToMeet: searchRegex },
        { passId: searchRegex }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const visitors = await Visitor.find(query).sort(sortOptions);
    res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Get single visitor by ID
// @route   GET /api/visitors/:id
// @access  Public
const getVisitorById = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found',
      });
    }
    res.status(200).json({
      success: true,
      data: visitor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Create a new visitor record
// @route   POST /api/visitors
// @access  Public
const createVisitor = async (req, res) => {
  try {
    const {
      visitorName,
      mobileNumber,
      email,
      organization,
      personToMeet,
      purpose,
      visitDateTime,
      status,
      remarks,
    } = req.body;

    // Basic Validation
    if (!visitorName || !mobileNumber || !email || !organization || !personToMeet || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Name, Mobile, Email, Organization, Person to Meet, Purpose).',
      });
    }

    const visitor = await Visitor.create({
      visitorName,
      mobileNumber,
      email,
      organization,
      personToMeet,
      purpose,
      visitDateTime: visitDateTime || new Date(),
      status: status || 'Checked In',
      remarks: remarks || '',
    });

    res.status(201).json({
      success: true,
      message: 'Visitor registered successfully!',
      data: visitor,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create visitor record',
    });
  }
};

// @desc    Update visitor details
// @route   PUT /api/visitors/:id
// @access  Public
const updateVisitor = async (req, res) => {
  try {
    let visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor record not found',
      });
    }

    // If status changed to Checked Out, set checkOutDateTime if not provided
    if (req.body.status === 'Checked Out' && visitor.status !== 'Checked Out') {
      req.body.checkOutDateTime = req.body.checkOutDateTime || new Date();
    } else if (req.body.status === 'Checked In') {
      req.body.checkOutDateTime = null;
    }

    visitor = await Visitor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Visitor details updated successfully!',
      data: visitor,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update visitor record',
    });
  }
};

// @desc    Toggle Visitor Check In / Check Out Status
// @route   PATCH /api/visitors/:id/status
// @access  Public
const toggleVisitorStatus = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found',
      });
    }

    const newStatus = visitor.status === 'Checked In' ? 'Checked Out' : 'Checked In';
    visitor.status = newStatus;
    visitor.checkOutDateTime = newStatus === 'Checked Out' ? new Date() : null;

    await visitor.save();

    res.status(200).json({
      success: true,
      message: `Visitor status updated to ${newStatus}`,
      data: visitor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Delete visitor record
// @route   DELETE /api/visitors/:id
// @access  Public
const deleteVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found',
      });
    }

    await Visitor.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Visitor record deleted successfully!',
      data: { id: req.params.id },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
    });
  }
};

// @desc    Get Analytics & Stats Overview
// @route   GET /api/visitors/stats/overview
// @access  Public
const getVisitorStats = async (req, res) => {
  try {
    const totalVisitors = await Visitor.countDocuments();
    const checkedInCount = await Visitor.countDocuments({ status: 'Checked In' });
    const checkedOutCount = await Visitor.countDocuments({ status: 'Checked Out' });

    // Today's count
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCount = await Visitor.countDocuments({
      visitDateTime: { $gte: startOfDay, $lte: endOfDay },
    });

    res.status(200).json({
      success: true,
      data: {
        totalVisitors,
        checkedInCount,
        checkedOutCount,
        todayCount,
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

// @desc    Seed sample visitor data
// @route   POST /api/visitors/seed
// @access  Public
const seedVisitors = async (req, res) => {
  try {
    // Check if data already exists
    const count = await Visitor.countDocuments();
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Database already contains ${count} visitor records. Clear or remove them to seed again.`,
      });
    }

    const sampleVisitors = [
      {
        passId: 'VIS-2026-1001',
        visitorName: 'Aarav Sharma',
        mobileNumber: '9876543210',
        email: 'aarav.sharma@techcorp.com',
        organization: 'TechCorp Solutions',
        personToMeet: 'Dr. Rajesh Verma (VP Engineering)',
        purpose: 'Client Meeting',
        visitDateTime: new Date(Date.now() - 3600000 * 2), // 2 hours ago
        status: 'Checked In',
        remarks: 'Carrying laptop (Asset ID: LAP-992)',
      },
      {
        passId: 'VIS-2026-1002',
        visitorName: 'Priya Sundaram',
        mobileNumber: '9123456789',
        email: 'priya.s@designstudio.io',
        organization: 'Design Studio Lab',
        personToMeet: 'Neha Gupta (Product Lead)',
        purpose: 'Interview',
        visitDateTime: new Date(Date.now() - 3600000 * 4), // 4 hours ago
        status: 'Checked Out',
        checkOutDateTime: new Date(Date.now() - 3600000 * 1),
        remarks: 'UX Designer Interview - Phase 2',
      },
      {
        passId: 'VIS-2026-1003',
        visitorName: 'Rohan Patel',
        mobileNumber: '9988776655',
        email: 'rohan.p@mit.edu.in',
        organization: 'MIT College of Engineering',
        personToMeet: 'Prof. Ananya Sen (HOD HR)',
        purpose: 'Industrial Visit',
        visitDateTime: new Date(Date.now() - 3600000 * 1.5),
        status: 'Checked In',
        remarks: 'Student Industrial Delegation Team Leader',
      },
      {
        passId: 'VIS-2026-1004',
        visitorName: 'Vikram Malhotra',
        mobileNumber: '9811223344',
        email: 'vikram@logisticsplus.com',
        organization: 'Logistics Plus',
        personToMeet: 'Suresh Kumar (Admin Executive)',
        purpose: 'Vendor Visit',
        visitDateTime: new Date(Date.now() - 3600000 * 6),
        status: 'Checked Out',
        checkOutDateTime: new Date(Date.now() - 3600000 * 3),
        remarks: 'Hardware Equipment Maintenance',
      },
      {
        passId: 'VIS-2026-1005',
        visitorName: 'Sneha Kulkarni',
        mobileNumber: '9765432109',
        email: 'sneha.k@fintech.co',
        organization: 'Global FinTech Ltd',
        personToMeet: 'Amitabh Joshi (CEO)',
        purpose: 'Official Business',
        visitDateTime: new Date(),
        status: 'Checked In',
        remarks: 'Audit & Compliance Discussion',
      },
    ];

    const inserted = await Visitor.insertMany(sampleVisitors);
    res.status(201).json({
      success: true,
      message: `Successfully seeded ${inserted.length} sample visitor records!`,
      data: inserted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to seed sample data',
      error: error.message,
    });
  }
};

module.exports = {
  getVisitors,
  getVisitorById,
  createVisitor,
  updateVisitor,
  toggleVisitorStatus,
  deleteVisitor,
  getVisitorStats,
  seedVisitors,
};
