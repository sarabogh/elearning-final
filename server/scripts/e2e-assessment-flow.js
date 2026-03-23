/* eslint-disable no-console */
const BASE_URL = process.env.E2E_API_BASE_URL || 'http://localhost:5001/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `HTTP ${response.status}`;
    const err = new Error(`${options.method || 'GET'} ${path} failed: ${message}`);
    err.status = response.status;
    err.body = data;
    throw err;
  }

  return data;
}

async function registerOrLogin({ name, email, password, role }) {
  try {
    const login = await request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    return login;
  } catch (error) {
    if (error.status !== 400) {
      throw error;
    }
  }

  await request('/auth/register', {
    method: 'POST',
    body: { name, email, password, role }
  });

  return request('/auth/login', {
    method: 'POST',
    body: { email, password }
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function main() {
  const stamp = Date.now();
  const facultyEmail = `faculty.e2e.${stamp}@example.com`;
  const learnerEmail = `learner.e2e.${stamp}@example.com`;
  const password = 'E2eFlow@123';

  console.log(`Using API base: ${BASE_URL}`);

  const facultyAuth = await registerOrLogin({
    name: 'E2E Faculty',
    email: facultyEmail,
    password,
    role: 'faculty'
  });

  const learnerAuth = await registerOrLogin({
    name: 'E2E Learner',
    email: learnerEmail,
    password,
    role: 'learner'
  });

  console.log('Created/logged in faculty and learner users.');

  const course = await request('/courses', {
    method: 'POST',
    token: facultyAuth.token,
    body: {
      title: `E2E Assessment Course ${stamp}`,
      description: 'End-to-end validation for assignments, tests, projects, grading, and progress.',
      category: 'Web Development',
      level: 'beginner',
      duration: 4,
      price: 0,
      isPublished: true
    }
  });

  const courseId = course._id;
  console.log(`Created course: ${courseId}`);

  await request(`/courses/${courseId}/lectures`, {
    method: 'POST',
    token: facultyAuth.token,
    body: {
      title: 'Lecture 1',
      description: 'Intro lecture for progress tracking',
      videoUrl: 'https://example.com/video',
      duration: 10
    }
  });

  let updatedCourse = await request(`/courses/${courseId}/assignments`, {
    method: 'POST',
    token: facultyAuth.token,
    body: {
      title: 'Assignment 1',
      description: 'Write a short answer',
      instructions: 'Submit text answer',
      submissionType: 'text',
      maxPoints: 100
    }
  });

  const assignmentId = updatedCourse.assignments[updatedCourse.assignments.length - 1]._id;

  updatedCourse = await request(`/courses/${courseId}/tests`, {
    method: 'POST',
    token: facultyAuth.token,
    body: {
      title: 'MCQ Test 1',
      description: 'One question test',
      autoGrade: true,
      questions: [
        {
          question: '2 + 2 = ?',
          options: ['3', '4', '5'],
          correctAnswer: '4',
          points: 10
        }
      ]
    }
  });

  const testId = updatedCourse.tests[updatedCourse.tests.length - 1]._id;

  updatedCourse = await request(`/courses/${courseId}/projects`, {
    method: 'POST',
    token: facultyAuth.token,
    body: {
      title: 'Project 1',
      description: 'Submit a project URL',
      requirements: 'Any valid URL',
      submissionType: 'url',
      maxPoints: 100
    }
  });

  const projectId = updatedCourse.projects[updatedCourse.projects.length - 1]._id;

  await request(`/courses/${courseId}/enroll`, {
    method: 'POST',
    token: learnerAuth.token
  });

  await request(`/courses/${courseId}/approve/${learnerAuth.user.id}`, {
    method: 'PUT',
    token: facultyAuth.token
  });

  await request(`/courses/${courseId}/progress`, {
    method: 'PUT',
    token: learnerAuth.token,
    body: {
      completed: true,
      lectureId: updatedCourse.lectures[0]._id
    }
  });

  await request(`/courses/${courseId}/assignments/${assignmentId}/submit`, {
    method: 'POST',
    token: learnerAuth.token,
    body: {
      textAnswer: 'My assignment submission'
    }
  });

  await request(`/courses/${courseId}/tests/${testId}/submit`, {
    method: 'POST',
    token: learnerAuth.token,
    body: {
      answers: ['4']
    }
  });

  await request(`/courses/${courseId}/projects/${projectId}/submit`, {
    method: 'POST',
    token: learnerAuth.token,
    body: {
      submissionUrl: 'https://example.com/project'
    }
  });

  await request(`/courses/${courseId}/assignments/${assignmentId}/grade/${learnerAuth.user.id}`, {
    method: 'PUT',
    token: facultyAuth.token,
    body: {
      score: 90,
      feedback: 'Nice work'
    }
  });

  await request(`/courses/${courseId}/projects/${projectId}/grade/${learnerAuth.user.id}`, {
    method: 'PUT',
    token: facultyAuth.token,
    body: {
      score: 80,
      feedback: 'Solid project'
    }
  });

  const finalCourse = await request(`/courses/${courseId}`, {
    method: 'GET',
    token: facultyAuth.token
  });

  const assignmentSubmission = finalCourse.assignments
    .find((a) => a._id === assignmentId)
    .submissions.find((s) => (s.student?._id || s.student) === learnerAuth.user.id);

  const testSubmission = finalCourse.tests
    .find((t) => t._id === testId)
    .submissions.find((s) => (s.student?._id || s.student) === learnerAuth.user.id);

  const projectSubmission = finalCourse.projects
    .find((p) => p._id === projectId)
    .submissions.find((s) => (s.student?._id || s.student) === learnerAuth.user.id);

  const overallGrade = finalCourse.grades.find((g) => (g.student?._id || g.student) === learnerAuth.user.id);

  assert(assignmentSubmission?.status === 'graded', 'assignment should be graded');
  assert(testSubmission?.score === 10, 'test should auto-grade to full score (10)');
  assert(projectSubmission?.status === 'graded', 'project should be graded');
  assert(overallGrade?.numericGrade !== null && overallGrade?.numericGrade !== undefined, 'overall numeric grade should exist');

  const learnerProfile = await request('/auth/profile', {
    method: 'GET',
    token: learnerAuth.token
  });

  const learnerEnrollment = (learnerProfile.enrolledCourses || []).find(
    (en) => (en.course?._id || en.course) === courseId
  );

  console.log('--- E2E Assessment Flow Summary ---');
  console.log(`Course: ${courseId}`);
  console.log(`Assignment status/score: ${assignmentSubmission.status}/${assignmentSubmission.score}`);
  console.log(`Test score: ${testSubmission.score}/${testSubmission.maxScore}`);
  console.log(`Project status/score: ${projectSubmission.status}/${projectSubmission.score}`);
  console.log(`Overall grade: ${overallGrade.grade} (numeric: ${overallGrade.numericGrade})`);
  console.log(`Learner progress: ${learnerEnrollment?.progress ?? 'N/A'}%`);
  console.log('E2E flow completed successfully.');
}

main().catch((error) => {
  console.error('E2E flow failed.');
  console.error(error.message);
  if (error.body) {
    console.error('Response body:', JSON.stringify(error.body));
  }
  process.exit(1);
});
