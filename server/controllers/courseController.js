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
      .populate('ratings.student', 'name')
      .populate('grades.student', 'name');

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
    const courseData = {
      ...req.body,
      instructor: req.user.id,
      // Ensure newly created courses are visible by default
      isPublished: req.body.isPublished ?? true
    };

    const course = new Course(courseData);

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

const updateProgress = async (req, res) => {
  try {
    const { lessonId, completed } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const enrollment = user.enrolledCourses.find(
      (en) => en.course.toString() === req.params.id
    );

    if (!enrollment || enrollment.completed) {
      return res.status(400).json({ message: 'Not enrolled or already completed' });
    }

    // Track completed lessons
    const lessonExists = course.lessons.some(
      (lesson) => lesson._id.toString() === lessonId
    );

    if (!lessonExists) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const alreadyCompleted = enrollment.completedLessons?.includes(lessonId);

    if (completed && !alreadyCompleted) {
      enrollment.completedLessons = enrollment.completedLessons || [];
      enrollment.completedLessons.push(lessonId);
    }

    if (!completed && alreadyCompleted) {
      enrollment.completedLessons = enrollment.completedLessons.filter(
        (id) => id.toString() !== lessonId
      );
    }

    // Calculate progress based on lessons count
    const totalLessons = course.lessons.length;
    const completedLessons = enrollment.completedLessons?.length || 0;

    enrollment.progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    enrollment.completed = totalLessons > 0 && enrollment.progress === 100;

    await user.save();

    res.json({
      progress: enrollment.progress,
      completed: enrollment.completed,
      completedLessons: enrollment.completedLessons
    });
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

    // Add to user's enrolled courses (if not already present)
    await User.findByIdAndUpdate(req.params.studentId, {
      $addToSet: { enrolledCourses: { course: course._id } }
    });

    await course.save();
    res.json({ message: 'Enrollment approved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const gradeStudent = async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Only instructor/admin can grade
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const studentId = req.params.studentId;

    const alreadyGraded = course.grades.find(
      (g) => g.student.toString() === studentId
    );

    if (alreadyGraded) {
      alreadyGraded.grade = grade;
      alreadyGraded.feedback = feedback;
      alreadyGraded.updatedAt = Date.now();
    } else {
      course.grades.push({ student: studentId, grade, feedback });
    }

    await course.save();
    res.json({ message: 'Grade saved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addMaterial = async (req, res) => {
  try {
    const { title, type, url, content } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    course.materials.push({ title, type, url, content, order: course.materials.length + 1 });
    await course.save();

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addLecture = async (req, res) => {
  try {
    const { title, description, videoUrl, duration } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    course.lectures.push({
      title,
      description,
      videoUrl,
      duration: duration || 0,
      order: (course.lectures || []).length + 1
    });

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, attachmentUrl } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    course.assignments.push({
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      attachmentUrl,
      order: (course.assignments || []).length + 1
    });

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addTest = async (req, res) => {
  try {
    const { title, description, questions, totalPoints, dueDate } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    course.tests.push({
      title,
      description,
      questions: questions || [],
      totalPoints: totalPoints || 100,
      dueDate: dueDate ? new Date(dueDate) : null,
      order: (course.tests || []).length + 1
    });

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addProject = async (req, res) => {
  try {
    const { title, description, requirements, dueDate, attachmentUrl } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    course.projects.push({
      title,
      description,
      requirements,
      dueDate: dueDate ? new Date(dueDate) : null,
      attachmentUrl,
      order: (course.projects || []).length + 1
    });

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getLessons = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select('lectures');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course.lectures || []);
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
  updateProgress,
  gradeStudent,
  addMaterial,
  addLecture,
  addAssignment,
  addTest,
  addProject,
  getLessons,
  submitRating
};