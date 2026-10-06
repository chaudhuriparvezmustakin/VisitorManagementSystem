const express = require('express');
const router = express.Router();
const {
  getVisitors,
  getVisitorById,
  createVisitor,
  updateVisitor,
  toggleVisitorStatus,
  deleteVisitor,
  getVisitorStats,
  seedVisitors,
} = require('../controllers/visitorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public or Protected Stats overview
router.route('/stats/overview')
  .get(protect, authorize('admin', 'receptionist', 'security'), getVisitorStats);

// Seed sample records (Admin only)
router.route('/seed')
  .post(protect, authorize('admin'), seedVisitors);

// Main visitor list & creation
router.route('/')
  .get(protect, authorize('admin', 'receptionist', 'security'), getVisitors)
  .post(protect, authorize('admin', 'receptionist'), createVisitor);

// Visitor specific operations
router.route('/:id')
  .get(protect, authorize('admin', 'receptionist', 'security'), getVisitorById)
  .put(protect, authorize('admin', 'receptionist'), updateVisitor)
  .delete(protect, authorize('admin'), deleteVisitor);

// Status toggle check-in/out
router.route('/:id/status')
  .patch(protect, authorize('admin', 'receptionist', 'security'), toggleVisitorStatus);

module.exports = router;
