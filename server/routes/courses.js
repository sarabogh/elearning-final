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
  updateLecture,
  deleteLecture,
  addAssignment,
  updateAssignment,
  deleteAssignment,
  addTest,
  updateTest,
  deleteTest,
  addProject,
  updateProject,
  deleteProject,
  submitAssignment,
  gradeAssignmentSubmission,
  reopenAssignmentSubmission,
  submitProject,
  gradeProjectSubmission,
  reopenProjectSubmission,
  submitTest,
  gradeTestSubmission,
  reopenTestSubmission,
  addMaterial,
  submitRating,
  getPendingCourses,
  approveCourse,
  rejectCourse
} = require('../controllers/courseController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Search and filter courses
router.get('/search/query', async (req, res) => {
  try {
    const { search, category, level, instructor } = req.query;
    let filter = { isPublished: true };

    if (search && search.length > 100) {
      return res.status(400).json({ message: 'Search term must be 100 characters or less' });
    }

    if (category && category.length > 80) {
      return res.status(400).json({ message: 'Category filter is too long' });
    }

    if (level && !['beginner', 'intermediate', 'advanced'].includes(level)) {
      return res.status(400).json({ message: 'Invalid level filter' });
    }

    if (search) {
      const safeSearch = escapeRegex(search.trim());
      filter.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (level) {
      filter.level = level;
    }

    if (instructor) {
      filter.instructor = instructor;
    }

    const courses = await require('../models/Course').find(filter)
      .populate('instructor', 'name email role profile.avatar profile.title profile.degree profile.bio')
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', getAllCourses);
router.get('/catalog/pending', auth, authorize('admin'), getPendingCourses);
router.get('/:id', getCourseById);
router.post('/', auth, authorize('admin', 'faculty'), createCourse);
router.put('/:id', auth, updateCourse);
router.delete('/:id', auth, authorize('admin'), deleteCourse);
router.post('/:id/enroll', auth, authorize('learner'), enrollInCourse);
router.put('/:id/approve/:studentId', auth, approveEnrollment);
router.put('/:id/progress', auth, authorize('learner'), updateProgress);
router.get('/:id/lessons', auth, getLessons);
router.post('/:id/lectures', auth, authorize('admin', 'faculty'), addLecture);
router.put('/:id/lectures/:lectureId', auth, authorize('admin', 'faculty'), updateLecture);
router.delete('/:id/lectures/:lectureId', auth, authorize('admin', 'faculty'), deleteLecture);
router.post('/:id/assignments', auth, authorize('admin', 'faculty'), addAssignment);
router.put('/:id/assignments/:assignmentId', auth, authorize('admin', 'faculty'), updateAssignment);
router.delete('/:id/assignments/:assignmentId', auth, authorize('admin', 'faculty'), deleteAssignment);
router.post('/:id/tests', auth, authorize('admin', 'faculty'), addTest);
router.put('/:id/tests/:testId', auth, authorize('admin', 'faculty'), updateTest);
router.delete('/:id/tests/:testId', auth, authorize('admin', 'faculty'), deleteTest);
router.post('/:id/projects', auth, authorize('admin', 'faculty'), addProject);
router.put('/:id/projects/:projectId', auth, authorize('admin', 'faculty'), updateProject);
router.delete('/:id/projects/:projectId', auth, authorize('admin', 'faculty'), deleteProject);
router.post('/:id/assignments/:assignmentId/submit', auth, authorize('learner'), submitAssignment);
router.put('/:id/assignments/:assignmentId/grade/:studentId', auth, authorize('admin', 'faculty'), gradeAssignmentSubmission);
router.delete('/:id/assignments/:assignmentId/submissions/:studentId', auth, authorize('admin', 'faculty'), reopenAssignmentSubmission);
router.post('/:id/tests/:testId/submit', auth, authorize('learner'), submitTest);
router.put('/:id/tests/:testId/grade/:studentId', auth, authorize('admin', 'faculty'), gradeTestSubmission);
router.delete('/:id/tests/:testId/submissions/:studentId', auth, authorize('admin', 'faculty'), reopenTestSubmission);
router.post('/:id/projects/:projectId/submit', auth, authorize('learner'), submitProject);
router.put('/:id/projects/:projectId/grade/:studentId', auth, authorize('admin', 'faculty'), gradeProjectSubmission);
router.delete('/:id/projects/:projectId/submissions/:studentId', auth, authorize('admin', 'faculty'), reopenProjectSubmission);
router.post('/:id/materials', auth, authorize('admin', 'faculty'), addMaterial);
router.post('/:id/rate', auth, authorize('learner'), submitRating);
router.put('/:id/grade/:studentId', auth, authorize('admin', 'faculty'), gradeStudent);
router.put('/:id/catalog/approve', auth, authorize('admin'), approveCourse);
router.put('/:id/catalog/reject', auth, authorize('admin'), rejectCourse);

module.exports = router;