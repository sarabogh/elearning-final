const express = require('express');
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  approveEnrollment,
  submitRating
} = require('../controllers/courseController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.post('/', auth, authorize('admin', 'faculty'), createCourse);
router.put('/:id', auth, updateCourse);
router.delete('/:id', auth, authorize('admin'), deleteCourse);
router.post('/:id/enroll', auth, authorize('learner'), enrollInCourse);
router.put('/:id/approve/:studentId', auth, approveEnrollment);
router.post('/:id/rate', auth, authorize('learner'), submitRating);

module.exports = router;