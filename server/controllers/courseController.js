const Course = require('../models/Course');
const User = require('../models/User');
const { createNotification, createBulkNotifications } = require('../services/notificationService');

const isTeacherForCourse = (course, user) => {
  return user.role === 'admin' || course.instructor.toString() === user.id;
};

const isApprovedLearner = (course, learnerId) => {
  return (course.enrolledStudents || []).some(
    (entry) => entry.student.toString() === learnerId && entry.status === 'approved'
  );
};

const allowedCourseUpdateFields = ['title', 'description', 'category', 'level', 'duration', 'price', 'thumbnail'];

const getUserEnrollment = async (userId, courseId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const enrollment = (user.enrolledCourses || []).find(
    (en) => en.course.toString() === courseId.toString()
  );

  return { user, enrollment };
};

const upsertOverallGrade = (course, studentId, numericScore, feedback) => {
  const letter = numericScore >= 90 ? 'A' : numericScore >= 80 ? 'B' : numericScore >= 70 ? 'C' : numericScore >= 60 ? 'D' : 'F';
  const gradeText = `${Math.round(numericScore)}% (${letter})`;

  const existing = (course.grades || []).find((g) => g.student.toString() === studentId.toString());
  if (existing) {
    existing.grade = gradeText;
    existing.numericGrade = Math.round(numericScore);
    if (feedback !== undefined) {
      existing.feedback = feedback;
    }
    existing.updatedAt = new Date();
  } else {
    course.grades.push({
      student: studentId,
      grade: gradeText,
      numericGrade: Math.round(numericScore),
      feedback: feedback || 'Auto-calculated from graded work'
    });
  }
};

const recalculateLearnerMetrics = async (course, learnerId) => {
  const enrollmentInfo = await getUserEnrollment(learnerId, course._id);
  if (!enrollmentInfo || !enrollmentInfo.enrollment) {
    return;
  }

  const { user, enrollment } = enrollmentInfo;

  const completedLectureIds = new Set((enrollment.completedLessons || []).map((id) => id.toString()));
  const lectureCount = (course.lectures || []).length;
  const completedLectures = Math.min(completedLectureIds.size, lectureCount);

  const assignmentCount = (course.assignments || []).length;
  const completedAssignments = (course.assignments || []).filter((a) =>
    (a.submissions || []).some((s) => s.student.toString() === learnerId.toString())
  ).length;

  const testCount = (course.tests || []).length;
  const completedTests = (course.tests || []).filter((t) =>
    (t.submissions || []).some((s) => s.student.toString() === learnerId.toString())
  ).length;

  const projectCount = (course.projects || []).length;
  const completedProjects = (course.projects || []).filter((p) =>
    (p.submissions || []).some((s) => s.student.toString() === learnerId.toString())
  ).length;

  const totalItems = lectureCount + assignmentCount + testCount + projectCount;
  const completedItems = completedLectures + completedAssignments + completedTests + completedProjects;

  enrollment.progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  enrollment.completed = totalItems > 0 && completedItems === totalItems;

  const gradedAssignmentSubmissions = (course.assignments || [])
    .map((a) => ({
      max: a.maxPoints || 100,
      sub: (a.submissions || []).find((s) => s.student.toString() === learnerId.toString() && s.score !== null && s.score !== undefined)
    }))
    .filter((x) => x.sub);

  const gradedProjectSubmissions = (course.projects || [])
    .map((p) => ({
      max: p.maxPoints || 100,
      sub: (p.submissions || []).find((s) => s.student.toString() === learnerId.toString() && s.score !== null && s.score !== undefined)
    }))
    .filter((x) => x.sub);

  const gradedTestSubmissions = (course.tests || [])
    .map((t) => ({
      max: t.totalPoints || (t.questions || []).reduce((sum, q) => sum + (q.points || 0), 0),
      sub: (t.submissions || []).find((s) => s.student.toString() === learnerId.toString() && s.score !== null && s.score !== undefined)
    }))
    .filter((x) => x.sub);

  let earned = 0;
  let possible = 0;

  gradedAssignmentSubmissions.forEach((item) => {
    earned += Number(item.sub.score || 0);
    possible += Number(item.max || 0);
  });

  gradedProjectSubmissions.forEach((item) => {
    earned += Number(item.sub.score || 0);
    possible += Number(item.max || 0);
  });

  gradedTestSubmissions.forEach((item) => {
    earned += Number(item.sub.score || 0);
    possible += Number(item.max || 0);
  });

  if (possible > 0) {
    const numeric = (earned / possible) * 100;
    upsertOverallGrade(course, learnerId, numeric);
  }

  await user.save();
};

const recalculateApprovedLearners = async (course) => {
  const approvedLearners = (course.enrolledStudents || [])
    .filter((entry) => entry.status === 'approved')
    .map((entry) => entry.student.toString());

  for (const learnerId of approvedLearners) {
    await recalculateLearnerMetrics(course, learnerId);
  }
};

const approvedStudentIds = (course) => {
  return (course.enrolledStudents || [])
    .filter((entry) => entry.status === 'approved')
    .map((entry) => entry.student.toString());
};

const dueDateChanged = (previousDate, nextDate) => {
  const previous = previousDate ? new Date(previousDate).getTime() : null;
  const next = nextDate ? new Date(nextDate).getTime() : null;
  return previous !== next;
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate('instructor', 'name email role profile.avatar profile.title profile.degree profile.bio')
      .populate('enrolledStudents.student', 'name email')
      .populate('ratings.student', 'name')
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email role profile.avatar profile.title profile.degree profile.bio')
      .populate('enrolledStudents.student', 'name email')
      .populate('ratings.student', 'name')
      .populate('grades.student', 'name')
      .populate('assignments.submissions.student', 'name email')
      .populate('tests.submissions.student', 'name email')
      .populate('projects.submissions.student', 'name email');

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
    const isAdmin = req.user.role === 'admin';
    const courseData = {
      ...req.body,
      instructor: req.user.id,
      isPublished: isAdmin,
      catalogStatus: isAdmin ? 'published' : 'pending'
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

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = allowedCourseUpdateFields.reduce((acc, field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        acc[field] = req.body[field];
      }
      return acc;
    }, {});

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: Date.now() },
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

    const alreadyEnrolled = (course.enrolledStudents || []).find(
      (student) => student.student.toString() === req.user.id
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

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const enrollment = (course.enrolledStudents || []).find(
      (student) => student.student.toString() === req.params.studentId
    );

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    enrollment.status = 'approved';

    await User.findByIdAndUpdate(req.params.studentId, {
      $addToSet: { enrolledCourses: { course: course._id } }
    });

    await course.save();
    await recalculateLearnerMetrics(course, req.params.studentId);
    await course.save();

    await createNotification(req, {
      user: req.params.studentId,
      sender: req.user.id,
      type: 'enrollment_approved',
      title: `Enrollment approved: ${course.title}`,
      body: 'You can now access lectures, assessments, and chat for this course.',
      priority: 'high',
      courseId: course._id,
      targetTab: 0
    });

    res.json({ message: 'Enrollment approved' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { lectureId, lessonId, completed } = req.body;
    const targetLectureId = lectureId || lessonId;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isApprovedLearner(course, req.user.id)) {
      return res.status(403).json({ message: 'Only approved learners can track progress' });
    }

    const lectureExists = (course.lectures || []).some(
      (lecture) => lecture._id.toString() === targetLectureId
    );

    if (!lectureExists) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    const enrollmentInfo = await getUserEnrollment(req.user.id, req.params.id);
    if (!enrollmentInfo || !enrollmentInfo.enrollment) {
      return res.status(400).json({ message: 'Not enrolled' });
    }

    const { user, enrollment } = enrollmentInfo;
    const completedList = new Set((enrollment.completedLessons || []).map((x) => x.toString()));

    if (completed) {
      completedList.add(targetLectureId);
    } else {
      completedList.delete(targetLectureId);
    }

    enrollment.completedLessons = Array.from(completedList);
    await user.save();

    await recalculateLearnerMetrics(course, req.user.id);
    await course.save();

    const latestEnrollmentInfo = await getUserEnrollment(req.user.id, req.params.id);
    const latestEnrollment = latestEnrollmentInfo?.enrollment;

    res.json({
      progress: latestEnrollment?.progress || 0,
      completed: latestEnrollment?.completed || false,
      completedLessons: latestEnrollment?.completedLessons || []
    });
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

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const studentId = req.params.studentId;
    const alreadyGraded = (course.grades || []).find((g) => g.student.toString() === studentId);

    if (alreadyGraded) {
      alreadyGraded.grade = grade;
      alreadyGraded.feedback = feedback;
      alreadyGraded.updatedAt = Date.now();
    } else {
      course.grades.push({ student: studentId, grade, feedback });
    }

    await course.save();

    await createNotification(req, {
      user: studentId,
      sender: req.user.id,
      type: 'grade_posted',
      title: `New final grade: ${course.title}`,
      body: `Your final grade is ${grade}.`,
      priority: 'high',
      courseId: course._id,
      targetTab: 5
    });

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

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    course.materials = course.materials || [];
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

    if (!isTeacherForCourse(course, req.user)) {
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

const updateLecture = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const lecture = (course.lectures || []).id(req.params.lectureId);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    const allowed = ['title', 'description', 'videoUrl', 'duration'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        lecture[key] = key === 'duration' ? Number(req.body[key]) || 0 : req.body[key];
      }
    });

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteLecture = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const lecture = (course.lectures || []).id(req.params.lectureId);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    lecture.deleteOne();
    await recalculateApprovedLearners(course);
    await course.save();

    res.json({ message: 'Lecture deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addAssignment = async (req, res) => {
  try {
    const { title, description, instructions, dueDate, attachmentUrl, submissionType, maxPoints } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    course.assignments.push({
      title,
      description,
      instructions,
      dueDate: dueDate ? new Date(dueDate) : null,
      attachmentUrl,
      submissionType: submissionType || 'text',
      maxPoints: maxPoints || 100,
      order: (course.assignments || []).length + 1
    });

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignment = (course.assignments || []).id(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const previousDueDate = assignment.dueDate;

    const allowed = ['title', 'description', 'instructions', 'dueDate', 'attachmentUrl', 'submissionType', 'maxPoints'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        if (key === 'dueDate') {
          assignment[key] = req.body[key] ? new Date(req.body[key]) : null;
        } else {
          assignment[key] = req.body[key];
        }
      }
    });

    await course.save();

    if (req.body.dueDate !== undefined && dueDateChanged(previousDueDate, assignment.dueDate)) {
      const nextDueLabel = assignment.dueDate ? new Date(assignment.dueDate).toLocaleString() : 'removed';
      const studentIds = approvedStudentIds(course);
      await createBulkNotifications(req, studentIds.map((studentId) => ({
        user: studentId,
        sender: req.user.id,
        type: 'deadline_changed',
        title: `Deadline updated: ${assignment.title}`,
        body: `Assignment due date is now ${nextDueLabel}.`,
        priority: 'high',
        courseId: course._id,
        targetTab: 1
      })));
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignment = (course.assignments || []).id(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    assignment.deleteOne();
    await recalculateApprovedLearners(course);
    await course.save();

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addTest = async (req, res) => {
  try {
    const { title, description, questions, totalPoints, autoGrade, dueDate } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const normalizedQuestions = (questions || []).map((q) => ({
      question: q.question,
      options: (q.options || []).filter(Boolean),
      correctAnswer: q.correctAnswer || '',
      points: q.points || 1
    }));

    const hasInvalidQuestion = normalizedQuestions.some((q) => !q.options.length || !q.options.includes(q.correctAnswer));
    if (hasInvalidQuestion) {
      return res.status(400).json({ message: 'Each test question must be multiple-choice and include a valid correct answer from options' });
    }

    const computedTotalPoints = normalizedQuestions.reduce((sum, q) => sum + (q.points || 0), 0);

    course.tests.push({
      title,
      description,
      questions: normalizedQuestions,
      totalPoints: totalPoints || computedTotalPoints || 100,
      autoGrade: autoGrade !== undefined ? Boolean(autoGrade) : true,
      dueDate: dueDate ? new Date(dueDate) : null,
      order: (course.tests || []).length + 1
    });

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTest = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const test = (course.tests || []).id(req.params.testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const previousDueDate = test.dueDate;

    if (req.body.title !== undefined) test.title = req.body.title;
    if (req.body.description !== undefined) test.description = req.body.description;
    if (req.body.autoGrade !== undefined) test.autoGrade = Boolean(req.body.autoGrade);
    if (req.body.dueDate !== undefined) test.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;

    if (req.body.questions !== undefined) {
      const normalizedQuestions = (req.body.questions || []).map((q) => ({
        question: q.question,
        options: (q.options || []).filter(Boolean),
        correctAnswer: q.correctAnswer || '',
        points: q.points || 1
      }));

      const hasInvalidQuestion = normalizedQuestions.some((q) => !q.options.length || !q.options.includes(q.correctAnswer));
      if (hasInvalidQuestion) {
        return res.status(400).json({ message: 'Each test question must be multiple-choice and include a valid correct answer from options' });
      }

      test.questions = normalizedQuestions;
      test.totalPoints = normalizedQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
    }

    await course.save();

    if (req.body.dueDate !== undefined && dueDateChanged(previousDueDate, test.dueDate)) {
      const nextDueLabel = test.dueDate ? new Date(test.dueDate).toLocaleString() : 'removed';
      const studentIds = approvedStudentIds(course);
      await createBulkNotifications(req, studentIds.map((studentId) => ({
        user: studentId,
        sender: req.user.id,
        type: 'deadline_changed',
        title: `Deadline updated: ${test.title}`,
        body: `Test due date is now ${nextDueLabel}.`,
        priority: 'high',
        courseId: course._id,
        targetTab: 2
      })));
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTest = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const test = (course.tests || []).id(req.params.testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    test.deleteOne();
    await recalculateApprovedLearners(course);
    await course.save();

    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addProject = async (req, res) => {
  try {
    const { title, description, requirements, dueDate, attachmentUrl, submissionType, maxPoints } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    course.projects.push({
      title,
      description,
      requirements,
      dueDate: dueDate ? new Date(dueDate) : null,
      attachmentUrl,
      submissionType: submissionType || 'text',
      maxPoints: maxPoints || 100,
      order: (course.projects || []).length + 1
    });

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const project = (course.projects || []).id(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const previousDueDate = project.dueDate;

    const allowed = ['title', 'description', 'requirements', 'dueDate', 'attachmentUrl', 'submissionType', 'maxPoints'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        if (key === 'dueDate') {
          project[key] = req.body[key] ? new Date(req.body[key]) : null;
        } else {
          project[key] = req.body[key];
        }
      }
    });

    await course.save();

    if (req.body.dueDate !== undefined && dueDateChanged(previousDueDate, project.dueDate)) {
      const nextDueLabel = project.dueDate ? new Date(project.dueDate).toLocaleString() : 'removed';
      const studentIds = approvedStudentIds(course);
      await createBulkNotifications(req, studentIds.map((studentId) => ({
        user: studentId,
        sender: req.user.id,
        type: 'deadline_changed',
        title: `Deadline updated: ${project.title}`,
        body: `Project due date is now ${nextDueLabel}.`,
        priority: 'high',
        courseId: course._id,
        targetTab: 3
      })));
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const project = (course.projects || []).id(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.deleteOne();
    await recalculateApprovedLearners(course);
    await course.save();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const submitAssignment = async (req, res) => {
  try {
    const { textAnswer, submissionUrl } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isApprovedLearner(course, req.user.id)) {
      return res.status(403).json({ message: 'Only approved learners can submit' });
    }

    const assignment = (course.assignments || []).id(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const hasContent = (textAnswer && textAnswer.trim()) || (submissionUrl && submissionUrl.trim());
    if (!hasContent) {
      return res.status(400).json({ message: 'Submission content is required' });
    }

    const existingSubmission = (assignment.submissions || []).find(
      (sub) => sub.student.toString() === req.user.id
    );

    if (existingSubmission) {
      return res.status(409).json({ message: 'You have already submitted this assignment. Ask your instructor to reopen it if you need to resubmit.' });
    }

    assignment.submissions.push({
      student: req.user.id,
      textAnswer: textAnswer || '',
      submissionUrl: submissionUrl || ''
    });

    await recalculateLearnerMetrics(course, req.user.id);
    await course.save();

    res.json({ message: 'Assignment submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const gradeAssignmentSubmission = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignment = (course.assignments || []).id(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const submission = (assignment.submissions || []).find(
      (sub) => sub.student.toString() === req.params.studentId
    );

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.score = Number(score);
    submission.feedback = feedback || '';
    submission.status = 'graded';
    submission.gradedAt = new Date();

    await recalculateLearnerMetrics(course, req.params.studentId);
    await course.save();

    await createNotification(req, {
      user: req.params.studentId,
      sender: req.user.id,
      type: 'grade_posted',
      title: `Assignment graded: ${assignment.title}`,
      body: `Score: ${submission.score}/${assignment.maxPoints || 100}`,
      priority: 'high',
      courseId: course._id,
      targetTab: 1
    });

    res.json({ message: 'Assignment graded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const submitProject = async (req, res) => {
  try {
    const { textAnswer, submissionUrl } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isApprovedLearner(course, req.user.id)) {
      return res.status(403).json({ message: 'Only approved learners can submit' });
    }

    const project = (course.projects || []).id(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const hasContent = (textAnswer && textAnswer.trim()) || (submissionUrl && submissionUrl.trim());
    if (!hasContent) {
      return res.status(400).json({ message: 'Submission content is required' });
    }

    const existingSubmission = (project.submissions || []).find(
      (sub) => sub.student.toString() === req.user.id
    );

    if (existingSubmission) {
      return res.status(409).json({ message: 'You have already submitted this project. Ask your instructor to reopen it if you need to resubmit.' });
    }

    project.submissions.push({
      student: req.user.id,
      textAnswer: textAnswer || '',
      submissionUrl: submissionUrl || ''
    });

    await recalculateLearnerMetrics(course, req.user.id);
    await course.save();

    res.json({ message: 'Project submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const gradeProjectSubmission = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const project = (course.projects || []).id(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const submission = (project.submissions || []).find(
      (sub) => sub.student.toString() === req.params.studentId
    );

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.score = Number(score);
    submission.feedback = feedback || '';
    submission.status = 'graded';
    submission.gradedAt = new Date();

    await recalculateLearnerMetrics(course, req.params.studentId);
    await course.save();

    await createNotification(req, {
      user: req.params.studentId,
      sender: req.user.id,
      type: 'grade_posted',
      title: `Project graded: ${project.title}`,
      body: `Score: ${submission.score}/${project.maxPoints || 100}`,
      priority: 'high',
      courseId: course._id,
      targetTab: 3
    });

    res.json({ message: 'Project graded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const submitTest = async (req, res) => {
  try {
    const { answers } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isApprovedLearner(course, req.user.id)) {
      return res.status(403).json({ message: 'Only approved learners can submit' });
    }

    const test = (course.tests || []).id(req.params.testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers must be an array' });
    }

    const maxScore = (test.questions || []).reduce((sum, q) => sum + (q.points || 0), 0);
    const shouldAutoGrade = test.autoGrade !== false;
    let score = 0;

    if (shouldAutoGrade) {
      (test.questions || []).forEach((question, index) => {
        const submittedAnswer = answers[index];
        const validOptions = question.options || [];
        if (!validOptions.includes(submittedAnswer)) {
          return;
        }
        if (submittedAnswer === question.correctAnswer) {
          score += question.points || 0;
        }
      });
    }

    const existingSubmission = (test.submissions || []).find(
      (sub) => sub.student.toString() === req.user.id
    );

    if (existingSubmission) {
      return res.status(409).json({ message: 'You have already submitted this test. Ask your instructor to reopen it if you need to retake it.' });
    }

    test.submissions.push({
      student: req.user.id,
      answers,
      score: shouldAutoGrade ? score : null,
      maxScore,
      autoGraded: shouldAutoGrade,
      feedback: '',
      gradedAt: shouldAutoGrade ? new Date() : null
    });

    await recalculateLearnerMetrics(course, req.user.id);
    await course.save();

    if (shouldAutoGrade) {
      return res.json({ message: 'Test submitted and auto-graded', score, maxScore, autoGraded: true });
    }

    return res.json({ message: 'Test submitted for manual grading', score: null, maxScore, autoGraded: false });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const gradeTestSubmission = async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!isTeacherForCourse(course, req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const test = (course.tests || []).id(req.params.testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const submission = (test.submissions || []).find(
      (sub) => sub.student.toString() === req.params.studentId
    );

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const maxScore = test.totalPoints || (test.questions || []).reduce((sum, q) => sum + (q.points || 0), 0) || 0;
    const numericScore = Number(score);

    if (Number.isNaN(numericScore)) {
      return res.status(400).json({ message: 'Score must be a number' });
    }

    if (numericScore < 0 || numericScore > maxScore) {
      return res.status(400).json({ message: `Score must be between 0 and ${maxScore}` });
    }

    submission.score = numericScore;
    submission.maxScore = maxScore;
    submission.feedback = feedback || '';
    submission.autoGraded = false;
    submission.gradedAt = new Date();

    await recalculateLearnerMetrics(course, req.params.studentId);
    await course.save();

    await createNotification(req, {
      user: req.params.studentId,
      sender: req.user.id,
      type: 'grade_posted',
      title: `Test graded: ${test.title}`,
      body: `Score: ${submission.score}/${maxScore}`,
      priority: 'high',
      courseId: course._id,
      targetTab: 2
    });

    return res.json({ message: 'Test graded successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
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
    const numericRating = Number(rating);
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const enrolled = (course.enrolledStudents || []).find(
      (student) => student.student.toString() === req.user.id && student.status === 'approved'
    );

    if (!enrolled) {
      return res.status(403).json({ message: 'Must be enrolled to rate' });
    }

    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    if (review && review.length > 500) {
      return res.status(400).json({ message: 'Review must be 500 characters or less' });
    }

    const existingRating = (course.ratings || []).find((r) => r.student.toString() === req.user.id);

    if (existingRating) {
      existingRating.rating = numericRating;
      existingRating.review = review;
    } else {
      course.ratings.push({ student: req.user.id, rating: numericRating, review });
    }

    const totalRating = (course.ratings || []).reduce((sum, r) => sum + r.rating, 0);
    course.averageRating = totalRating / course.ratings.length;

    await course.save();
    res.json({ message: 'Rating submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const reopenAssignmentSubmission = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!isTeacherForCourse(course, req.user)) return res.status(403).json({ message: 'Access denied' });

    const assignment = (course.assignments || []).id(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const idx = (assignment.submissions || []).findIndex(
      (sub) => sub.student.toString() === req.params.studentId
    );
    if (idx === -1) return res.status(404).json({ message: 'Submission not found' });

    assignment.submissions.splice(idx, 1);
    await recalculateLearnerMetrics(course, req.params.studentId);
    await course.save();
    res.json({ message: 'Assignment submission reopened' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const reopenProjectSubmission = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!isTeacherForCourse(course, req.user)) return res.status(403).json({ message: 'Access denied' });

    const project = (course.projects || []).id(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const idx = (project.submissions || []).findIndex(
      (sub) => sub.student.toString() === req.params.studentId
    );
    if (idx === -1) return res.status(404).json({ message: 'Submission not found' });

    project.submissions.splice(idx, 1);
    await recalculateLearnerMetrics(course, req.params.studentId);
    await course.save();
    res.json({ message: 'Project submission reopened' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const reopenTestSubmission = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (!isTeacherForCourse(course, req.user)) return res.status(403).json({ message: 'Access denied' });

    const test = (course.tests || []).id(req.params.testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const idx = (test.submissions || []).findIndex(
      (sub) => sub.student.toString() === req.params.studentId
    );
    if (idx === -1) return res.status(404).json({ message: 'Submission not found' });

    test.submissions.splice(idx, 1);
    await recalculateLearnerMetrics(course, req.params.studentId);
    await course.save();
    res.json({ message: 'Test submission reopened' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getPendingCourses = async (req, res) => {
  try {
    const courses = await Course.find({ catalogStatus: 'pending' })
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const approveCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.isPublished = true;
    course.catalogStatus = 'published';
    course.rejectionReason = '';
    await course.save();

    res.json({ message: 'Course approved and published to catalog' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const rejectCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.isPublished = false;
    course.catalogStatus = 'rejected';
    course.rejectionReason = req.body.reason || '';
    await course.save();

    res.json({ message: 'Course rejected' });
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
  getLessons,
  submitRating,
  getPendingCourses,
  approveCourse,
  rejectCourse
};
