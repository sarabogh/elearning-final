const express = require('express');
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  approveEnrollment,
  updateProgress,
  gradeStudent,
  getLessons,
  addLecture,
  addAssignment,
  addTest,
  addProject,
  addMaterial,
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
router.put('/:id/progress', auth, authorize('learner'), updateProgress);
router.get('/:id/lessons', auth, getLessons);
router.post('/:id/lectures', auth, authorize('admin', 'faculty'), addLecture);
router.post('/:id/assignments', auth, authorize('admin', 'faculty'), addAssignment);
router.post('/:id/tests', auth, authorize('admin', 'faculty'), addTest);
router.post('/:id/projects', auth, authorize('admin', 'faculty'), addProject);
router.post('/:id/materials', auth, authorize('admin', 'faculty'), addMaterial);
router.post('/:id/rate', auth, authorize('learner'), submitRating);
router.put('/:id/grade/:studentId', auth, authorize('admin', 'faculty'), gradeStudent);

module.exports = router;