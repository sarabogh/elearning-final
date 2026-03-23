const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const isSelf = req.user.id === req.params.id;
    const isAdmin = req.user.role === 'admin';

    let teachesTargetLearner = false;
    if (!isSelf && !isAdmin) {
      const sharedCourse = await Course.findOne({
        instructor: req.user.id,
        enrolledStudents: {
          $elemMatch: {
            student: req.params.id,
            status: 'approved'
          }
        }
      }).select('_id');

      teachesTargetLearner = Boolean(sharedCourse);
    }

    if (!isSelf && !isAdmin && !teachesTargetLearner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;