const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Course = require('../models/Course');

let app;
let mongoServer;

const stamp = Date.now();
const adminEmail = `routes.admin.${stamp}@example.com`;
const facultyEmail = `routes.faculty.${stamp}@example.com`;
const learnerEmail = `routes.learner.${stamp}@example.com`;
const password = 'Test@1234';

let adminToken = '';
let facultyToken = '';
let learnerToken = '';
let adminId = '';
let facultyId = '';
let learnerId = '';
let courseId = '';
let lectureId = '';
let assignmentId = '';
let autoTestId = '';
let manualTestId = '';
let projectId = '';

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

const waitForMongooseConnection = async (timeoutMs = 20000) => {
  const start = Date.now();
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Timed out waiting for mongoose connection');
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
};

describe('Current API functionality', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_TEST_URI = mongoServer.getUri();

    app = require('../server');
    await waitForMongooseConnection();
  }, 30000);

  afterAll(async () => {
    try {
      if (courseId) {
        await Course.deleteOne({ _id: courseId });
      }
      await User.deleteMany({ email: { $in: [adminEmail, facultyEmail, learnerEmail] } });
    } finally {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
      }
      if (mongoServer) {
        await mongoServer.stop();
      }
    }
  }, 30000);

  it('registers and logs in faculty + learner', async () => {
    const adminRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Routes Admin', email: adminEmail, password, role: 'admin' });

    expect(adminRegister.statusCode).toBe(201);
    expect(adminRegister.body).toHaveProperty('token');
    adminToken = adminRegister.body.token;
    adminId = adminRegister.body.user.id;

    const facultyRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Routes Faculty', email: facultyEmail, password, role: 'faculty' });

    expect(facultyRegister.statusCode).toBe(201);
    expect(facultyRegister.body).toHaveProperty('token');
    facultyToken = facultyRegister.body.token;
    facultyId = facultyRegister.body.user.id;

    const learnerRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Routes Learner', email: learnerEmail, password, role: 'learner' });

    expect(learnerRegister.statusCode).toBe(201);
    expect(learnerRegister.body).toHaveProperty('token');
    learnerToken = learnerRegister.body.token;
    learnerId = learnerRegister.body.user.id;

    const facultyLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: facultyEmail, password });
    expect(facultyLogin.statusCode).toBe(200);

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password });
    expect(adminLogin.statusCode).toBe(200);

    const learnerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: learnerEmail, password });
    expect(learnerLogin.statusCode).toBe(200);
  });

  it('creates a course and core assessment content', async () => {
    const createCourseRes = await request(app)
      .post('/api/courses')
      .set(authHeader(facultyToken))
      .send({
        title: `Routes Current Functionality ${stamp}`,
        description: 'Integration verification for current behavior',
        category: 'Web Development',
        level: 'beginner',
        duration: 6,
        price: 0,
        isPublished: true
      });

    expect(createCourseRes.statusCode).toBe(201);
    courseId = createCourseRes.body._id;

    const lectureRes = await request(app)
      .post(`/api/courses/${courseId}/lectures`)
      .set(authHeader(facultyToken))
      .send({
        title: 'Lecture A',
        description: 'Lecture for progress',
        videoUrl: 'https://example.com/video.mp4',
        duration: 9
      });

    expect([200, 201]).toContain(lectureRes.statusCode);
    lectureId = lectureRes.body.lectures[lectureRes.body.lectures.length - 1]._id;

    const assignmentRes = await request(app)
      .post(`/api/courses/${courseId}/assignments`)
      .set(authHeader(facultyToken))
      .send({
        title: 'Assignment A',
        description: 'Single-submit assignment',
        instructions: 'Provide text answer',
        submissionType: 'text',
        maxPoints: 100
      });

    expect([200, 201]).toContain(assignmentRes.statusCode);
    assignmentId = assignmentRes.body.assignments[assignmentRes.body.assignments.length - 1]._id;

    const autoTestRes = await request(app)
      .post(`/api/courses/${courseId}/tests`)
      .set(authHeader(facultyToken))
      .send({
        title: 'Auto Test',
        description: 'Auto grading test',
        autoGrade: true,
        questions: [
          {
            question: '2 + 2 = ?',
            options: ['3', '4', '5'],
            correctAnswer: '4',
            points: 10
          }
        ]
      });

    expect([200, 201]).toContain(autoTestRes.statusCode);
    autoTestId = autoTestRes.body.tests[autoTestRes.body.tests.length - 1]._id;

    const manualTestRes = await request(app)
      .post(`/api/courses/${courseId}/tests`)
      .set(authHeader(facultyToken))
      .send({
        title: 'Manual Test',
        description: 'Manual grading test',
        autoGrade: false,
        questions: [
          {
            question: 'Capital of France?',
            options: ['Paris', 'Rome', 'Berlin'],
            correctAnswer: 'Paris',
            points: 10
          }
        ]
      });

    expect([200, 201]).toContain(manualTestRes.statusCode);
    manualTestId = manualTestRes.body.tests[manualTestRes.body.tests.length - 1]._id;

    const projectRes = await request(app)
      .post(`/api/courses/${courseId}/projects`)
      .set(authHeader(facultyToken))
      .send({
        title: 'Project A',
        description: 'Single-submit project',
        requirements: 'Submit any URL',
        submissionType: 'url',
        maxPoints: 100
      });

    expect([200, 201]).toContain(projectRes.statusCode);
    projectId = projectRes.body.projects[projectRes.body.projects.length - 1]._id;

    expect(lectureId).toBeTruthy();
    expect(assignmentId).toBeTruthy();
    expect(autoTestId).toBeTruthy();
    expect(manualTestId).toBeTruthy();
    expect(projectId).toBeTruthy();
  });

  it('handles enrollment, approval, and lecture progress update', async () => {
    const enrollRes = await request(app)
      .post(`/api/courses/${courseId}/enroll`)
      .set(authHeader(learnerToken));

    expect(enrollRes.statusCode).toBe(200);

    const approveRes = await request(app)
      .put(`/api/courses/${courseId}/approve/${learnerId}`)
      .set(authHeader(adminToken));

    expect(approveRes.statusCode).toBe(200);

    const progressRes = await request(app)
      .put(`/api/courses/${courseId}/progress`)
      .set(authHeader(learnerToken))
      .send({ lectureId, completed: true });

    expect(progressRes.statusCode).toBe(200);
  });

  it('enforces assignment one-time submit and allows teacher reopen', async () => {
    const firstSubmit = await request(app)
      .post(`/api/courses/${courseId}/assignments/${assignmentId}/submit`)
      .set(authHeader(learnerToken))
      .send({ textAnswer: 'First answer' });

    expect(firstSubmit.statusCode).toBe(200);

    const secondSubmit = await request(app)
      .post(`/api/courses/${courseId}/assignments/${assignmentId}/submit`)
      .set(authHeader(learnerToken))
      .send({ textAnswer: 'Second answer' });

    expect(secondSubmit.statusCode).toBe(409);

    const reopenRes = await request(app)
      .delete(`/api/courses/${courseId}/assignments/${assignmentId}/submissions/${learnerId}`)
      .set(authHeader(facultyToken));

    expect(reopenRes.statusCode).toBe(200);

    const thirdSubmit = await request(app)
      .post(`/api/courses/${courseId}/assignments/${assignmentId}/submit`)
      .set(authHeader(learnerToken))
      .send({ textAnswer: 'Resubmitted answer' });

    expect(thirdSubmit.statusCode).toBe(200);
  });

  it('supports auto-graded test path with one-time lock and reopen', async () => {
    const firstSubmit = await request(app)
      .post(`/api/courses/${courseId}/tests/${autoTestId}/submit`)
      .set(authHeader(learnerToken))
      .send({ answers: ['4'] });

    expect(firstSubmit.statusCode).toBe(200);
    expect(firstSubmit.body).toMatchObject({ autoGraded: true, score: 10, maxScore: 10 });

    const secondSubmit = await request(app)
      .post(`/api/courses/${courseId}/tests/${autoTestId}/submit`)
      .set(authHeader(learnerToken))
      .send({ answers: ['4'] });

    expect(secondSubmit.statusCode).toBe(409);

    const reopenRes = await request(app)
      .delete(`/api/courses/${courseId}/tests/${autoTestId}/submissions/${learnerId}`)
      .set(authHeader(facultyToken));

    expect(reopenRes.statusCode).toBe(200);

    const resubmit = await request(app)
      .post(`/api/courses/${courseId}/tests/${autoTestId}/submit`)
      .set(authHeader(learnerToken))
      .send({ answers: ['4'] });

    expect(resubmit.statusCode).toBe(200);
  });

  it('supports manual test submit, teacher grading, and reopen', async () => {
    const submitRes = await request(app)
      .post(`/api/courses/${courseId}/tests/${manualTestId}/submit`)
      .set(authHeader(learnerToken))
      .send({ answers: ['Paris'] });

    expect(submitRes.statusCode).toBe(200);
    expect(submitRes.body).toMatchObject({ autoGraded: false, score: null, maxScore: 10 });

    const gradeRes = await request(app)
      .put(`/api/courses/${courseId}/tests/${manualTestId}/grade/${learnerId}`)
      .set(authHeader(facultyToken))
      .send({ score: 9, feedback: 'Good answer' });

    expect(gradeRes.statusCode).toBe(200);

    const reopenRes = await request(app)
      .delete(`/api/courses/${courseId}/tests/${manualTestId}/submissions/${learnerId}`)
      .set(authHeader(facultyToken));

    expect(reopenRes.statusCode).toBe(200);

    const resubmitRes = await request(app)
      .post(`/api/courses/${courseId}/tests/${manualTestId}/submit`)
      .set(authHeader(learnerToken))
      .send({ answers: ['Paris'] });

    expect(resubmitRes.statusCode).toBe(200);
  });

  it('enforces project one-time submit and allows reopen', async () => {
    const firstSubmit = await request(app)
      .post(`/api/courses/${courseId}/projects/${projectId}/submit`)
      .set(authHeader(learnerToken))
      .send({ submissionUrl: 'https://example.com/p1' });

    expect(firstSubmit.statusCode).toBe(200);

    const secondSubmit = await request(app)
      .post(`/api/courses/${courseId}/projects/${projectId}/submit`)
      .set(authHeader(learnerToken))
      .send({ submissionUrl: 'https://example.com/p2' });

    expect(secondSubmit.statusCode).toBe(409);

    const reopenRes = await request(app)
      .delete(`/api/courses/${courseId}/projects/${projectId}/submissions/${learnerId}`)
      .set(authHeader(facultyToken));

    expect(reopenRes.statusCode).toBe(200);

    const thirdSubmit = await request(app)
      .post(`/api/courses/${courseId}/projects/${projectId}/submit`)
      .set(authHeader(learnerToken))
      .send({ submissionUrl: 'https://example.com/p3' });

    expect(thirdSubmit.statusCode).toBe(200);
  });
});
