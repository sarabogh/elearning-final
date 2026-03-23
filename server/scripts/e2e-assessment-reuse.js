/* eslint-disable no-console */
const BASE_URL = process.env.E2E_API_BASE_URL || 'http://localhost:5001/api';
const FACULTY_TOKEN = process.env.FACULTY_TOKEN;
const LEARNER_TOKEN = process.env.LEARNER_TOKEN;
const EXISTING_COURSE_ID = process.env.COURSE_ID;
const SKIP_APPROVAL = String(process.env.SKIP_APPROVAL || 'false').toLowerCase() === 'true';

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

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function safeEnroll(courseId, learnerToken) {
  try {
    await request(`/courses/${courseId}/enroll`, {
      method: 'POST',
      token: learnerToken
    });
    return 'requested';
  } catch (error) {
    const message = (error.body?.message || '').toLowerCase();
    if (error.status === 400 && message.includes('already')) {
      return 'already-enrolled';
    }
    throw error;
  }
}

async function main() {
  if (!FACULTY_TOKEN || !LEARNER_TOKEN) {
    console.error('Missing required environment variables: FACULTY_TOKEN and LEARNER_TOKEN');
    console.error('Optional variables: COURSE_ID, E2E_API_BASE_URL, SKIP_APPROVAL');
    process.exit(1);
  }

  const stamp = Date.now();
  console.log(`Using API base: ${BASE_URL}`);

  const facultyProfile = await request('/auth/profile', {
    method: 'GET',
    token: FACULTY_TOKEN
  });

  const learnerProfile = await request('/auth/profile', {
    method: 'GET',
    token: LEARNER_TOKEN
  });

  const facultyId = facultyProfile._id || facultyProfile.id;
  const learnerId = learnerProfile._id || learnerProfile.id;

  let courseId = EXISTING_COURSE_ID;

  if (!courseId) {
    const createdCourse = await request('/courses', {
      method: 'POST',
      token: FACULTY_TOKEN,
      body: {
        title: `Reuse E2E Course ${stamp}`,
        description: 'Runs assessment flow against real auth tokens',
        category: 'Web Development',
        level: 'beginner',
        duration: 3,
        price: 0,
        isPublished: true
      }
    });

    courseId = createdCourse._id;
    console.log(`Created course for reuse flow: ${courseId}`);
  } else {
    console.log(`Using existing course: ${courseId}`);
  }

  let course = await request(`/courses/${courseId}`, {
    method: 'GET',
    token: FACULTY_TOKEN
  });

  const isTeacher =
    facultyProfile.role === 'admin' ||
    (course.instructor?._id || course.instructor) === facultyId;
  assert(isTeacher, 'Provided faculty token must belong to course instructor or admin');

  const lectureResponse = await request(`/courses/${courseId}/lectures`, {
    method: 'POST',
    token: FACULTY_TOKEN,
    body: {
      title: `Reuse Lecture ${stamp}`,
      description: 'Lecture for progress tick in reuse flow',
      videoUrl: 'https://example.com/reuse-video',
      duration: 8
    }
  });

  const lectureId = lectureResponse.lectures[lectureResponse.lectures.length - 1]._id;

  const assignmentResponse = await request(`/courses/${courseId}/assignments`, {
    method: 'POST',
    token: FACULTY_TOKEN,
    body: {
      title: `Reuse Assignment ${stamp}`,
      description: 'Assignment for reuse flow',
      instructions: 'Submit text answer',
      submissionType: 'text',
      maxPoints: 100
    }
  });

  const assignmentId = assignmentResponse.assignments[assignmentResponse.assignments.length - 1]._id;

  const testResponse = await request(`/courses/${courseId}/tests`, {
    method: 'POST',
    token: FACULTY_TOKEN,
    body: {
      title: `Reuse Test ${stamp}`,
      description: 'MCQ test for reuse flow',
      autoGrade: true,
      questions: [
        {
          question: 'Capital of France?',
          options: ['Paris', 'Rome', 'Berlin'],
          correctAnswer: 'Paris',
          points: 10
        }
      ]
    }
  });

  const testId = testResponse.tests[testResponse.tests.length - 1]._id;

  const projectResponse = await request(`/courses/${courseId}/projects`, {
    method: 'POST',
    token: FACULTY_TOKEN,
    body: {
      title: `Reuse Project ${stamp}`,
      description: 'Project for reuse flow',
      requirements: 'Submit URL',
      submissionType: 'url',
      maxPoints: 100
    }
  });

  const projectId = projectResponse.projects[projectResponse.projects.length - 1]._id;

  const enrollStatus = await safeEnroll(courseId, LEARNER_TOKEN);
  console.log(`Enrollment step result: ${enrollStatus}`);

  if (!SKIP_APPROVAL) {
    try {
      await request(`/courses/${courseId}/approve/${learnerId}`, {
        method: 'PUT',
        token: FACULTY_TOKEN
      });
      console.log('Enrollment approved in this run.');
    } catch (error) {
      const message = (error.body?.message || '').toLowerCase();
      if (error.status === 404 && message.includes('enrollment not found')) {
        console.log('Approval skipped because learner was already in approved state.');
      } else {
        throw error;
      }
    }
  }

  await request(`/courses/${courseId}/progress`, {
    method: 'PUT',
    token: LEARNER_TOKEN,
    body: {
      lectureId,
      completed: true
    }
  });

  await request(`/courses/${courseId}/assignments/${assignmentId}/submit`, {
    method: 'POST',
    token: LEARNER_TOKEN,
    body: {
      textAnswer: 'Reuse flow assignment answer'
    }
  });

  await request(`/courses/${courseId}/tests/${testId}/submit`, {
    method: 'POST',
    token: LEARNER_TOKEN,
    body: {
      answers: ['Paris']
    }
  });

  await request(`/courses/${courseId}/projects/${projectId}/submit`, {
    method: 'POST',
    token: LEARNER_TOKEN,
    body: {
      submissionUrl: 'https://example.com/reuse-project'
    }
  });

  await request(`/courses/${courseId}/assignments/${assignmentId}/grade/${learnerId}`, {
    method: 'PUT',
    token: FACULTY_TOKEN,
    body: {
      score: 88,
      feedback: 'Good assignment'
    }
  });

  await request(`/courses/${courseId}/projects/${projectId}/grade/${learnerId}`, {
    method: 'PUT',
    token: FACULTY_TOKEN,
    body: {
      score: 92,
      feedback: 'Great project'
    }
  });

  course = await request(`/courses/${courseId}`, {
    method: 'GET',
    token: FACULTY_TOKEN
  });

  const assignmentSubmission = course.assignments
    .find((a) => a._id === assignmentId)
    .submissions.find((s) => (s.student?._id || s.student) === learnerId);

  const testSubmission = course.tests
    .find((t) => t._id === testId)
    .submissions.find((s) => (s.student?._id || s.student) === learnerId);

  const projectSubmission = course.projects
    .find((p) => p._id === projectId)
    .submissions.find((s) => (s.student?._id || s.student) === learnerId);

  const overallGrade = course.grades.find((g) => (g.student?._id || g.student) === learnerId);

  assert(assignmentSubmission?.status === 'graded', 'assignment should be graded');
  assert(testSubmission?.score === 10, 'test should be auto-graded to 10/10');
  assert(projectSubmission?.status === 'graded', 'project should be graded');
  assert(overallGrade?.numericGrade !== null && overallGrade?.numericGrade !== undefined, 'overall numeric grade should exist');

  const learnerProfileLatest = await request('/auth/profile', {
    method: 'GET',
    token: LEARNER_TOKEN
  });

  const learnerEnrollment = (learnerProfileLatest.enrolledCourses || []).find(
    (en) => (en.course?._id || en.course) === courseId
  );

  console.log('--- Reuse E2E Assessment Summary ---');
  console.log(`Course: ${courseId}`);
  console.log(`Lecture: ${lectureId}`);
  console.log(`Assignment: ${assignmentId} -> ${assignmentSubmission.status}/${assignmentSubmission.score}`);
  console.log(`Test: ${testId} -> ${testSubmission.score}/${testSubmission.maxScore}`);
  console.log(`Project: ${projectId} -> ${projectSubmission.status}/${projectSubmission.score}`);
  console.log(`Overall grade: ${overallGrade.grade} (numeric: ${overallGrade.numericGrade})`);
  console.log(`Learner progress: ${learnerEnrollment?.progress ?? 'N/A'}%`);
  console.log('Reuse flow completed successfully.');
}

main().catch((error) => {
  console.error('Reuse flow failed.');
  console.error(error.message);
  if (error.body) {
    console.error('Response body:', JSON.stringify(error.body));
  }
  process.exit(1);
});
