const Course = require('../models/Course');
const User = require('../models/User');

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('enrolledStudents.student', 'name email')
      .populate('ratings.student', 'name');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const createCourse = async (req, res) => {
  try {
    const course = new Course({
      ...req.body,
      instructor: req.user.id
    });

    await course.save();
    await User.findByIdAndUpdate(req.user.id, {
      $push: { createdCourses: course._id }
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is admin or the instructor
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const alreadyEnrolled = course.enrolledStudents.find(
      student => student.student.toString() === req.user.id
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    course.enrolledStudents.push({
      student: req.user.id,
      status: 'pending'
    });

    await course.save();
    res.json({ message: 'Enrollment request submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const approveEnrollment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const enrollment = course.enrolledStudents.find(
      student => student.student.toString() === req.params.studentId
    );

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    enrollment.status = 'approved';

    // Add to user's enrolled courses
    await User.findByIdAndUpdate(req.params.studentId, {
      $push: { enrolledCourses: { course: course._id } }
    });

    await course.save();
    res.json({ message: 'Enrollment approved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const submitRating = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is enrolled
    const isEnrolled = course.enrolledStudents.find(
      student => student.student.toString() === req.user.id && student.status === 'approved'
    );

    if (!isEnrolled) {
      return res.status(403).json({ message: 'Must be enrolled to rate' });
    }

    // Check if already rated
    const existingRating = course.ratings.find(
      r => r.student.toString() === req.user.id
    );

    if (existingRating) {
      existingRating.rating = rating;
      existingRating.review = review;
    } else {
      course.ratings.push({
        student: req.user.id,
        rating,
        review
      });
    }

    // Calculate average rating
    const totalRating = course.ratings.reduce((sum, r) => sum + r.rating, 0);
    course.averageRating = totalRating / course.ratings.length;

    await course.save();
    res.json({ message: 'Rating submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  approveEnrollment,
  submitRating
};