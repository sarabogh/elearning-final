const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Course = require('../models/Course');

let app;
let mongoServer;

const stamp = Date.now();
const adminEmail = `authz.admin.${stamp}@example.com`;
const ownerFacultyEmail = `authz.owner.faculty.${stamp}@example.com`;
const otherFacultyEmail = `authz.other.faculty.${stamp}@example.com`;
const learnerEmail = `authz.learner.${stamp}@example.com`;
const password = 'Test@1234';

let adminToken = '';
let ownerFacultyToken = '';
let otherFacultyToken = '';
let learnerToken = '';
let learnerId = '';
let courseId = '';
let lectureId = '';
let assignmentId = '';

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

describe('Authorization and access control', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_TEST_URI = mongoServer.getUri();

    app = require('../server');
    await waitForMongooseConnection();

    const adminRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Authz Admin', email: adminEmail, password, role: 'admin' });
    adminToken = adminRegister.body.token;

    const ownerFacultyRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Owner Faculty', email: ownerFacultyEmail, password, role: 'faculty' });
    ownerFacultyToken = ownerFacultyRegister.body.token;

    const otherFacultyRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other Faculty', email: otherFacultyEmail, password, role: 'faculty' });
    otherFacultyToken = otherFacultyRegister.body.token;

    const learnerRegister = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Authz Learner', email: learnerEmail, password, role: 'learner' });
    learnerToken = learnerRegister.body.token;
    learnerId = learnerRegister.body.user.id;

    const createdCourse = await request(app)
      .post('/api/courses')
      .set(authHeader(ownerFacultyToken))
      .send({
        title: `AuthZ Course ${stamp}`,
        description: 'Course used for access-control assertions',
        category: 'Web Development',
        level: 'beginner',
        duration: 4,
        price: 0,
        isPublished: true
      });

    courseId = createdCourse.body._id;

    const lectureRes = await request(app)
      .post(`/api/courses/${courseId}/lectures`)
      .set(authHeader(ownerFacultyToken))
      .send({
        title: 'Authz Lecture',
        description: 'Lecture for progress checks',
        videoUrl: 'https://example.com/authz-video.mp4',
        duration: 7
      });
    lectureId = lectureRes.body.lectures[lectureRes.body.lectures.length - 1]._id;

    const assignmentRes = await request(app)
      .post(`/api/courses/${courseId}/assignments`)
      .set(authHeader(ownerFacultyToken))
      .send({
        title: 'Authz Assignment',
        description: 'Assignment for role checks',
        instructions: 'Submit text',
        submissionType: 'text',
        maxPoints: 100
      });
    assignmentId = assignmentRes.body.assignments[assignmentRes.body.assignments.length - 1]._id;

    await request(app)
      .post(`/api/courses/${courseId}/enroll`)
      .set(authHeader(learnerToken));
  }, 30000);

  afterAll(async () => {
    try {
      if (courseId) {
        await Course.deleteOne({ _id: courseId });
      }
      await User.deleteMany({ email: { $in: [adminEmail, ownerFacultyEmail, otherFacultyEmail, learnerEmail] } });
    } finally {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
      }
      if (mongoServer) {
        await mongoServer.stop();
      }
    }
  }, 30000);

  it('returns 401 when token is missing', async () => {
    const res = await request(app).post('/api/courses').send({ title: 'No token course' });
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  it('returns 401 when token is invalid', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set(authHeader('invalid.token.value'));
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid token');
  });

  it('blocks learner from faculty/admin course creation route', async () => {
    const res = await request(app)
      .post('/api/courses')
      .set(authHeader(learnerToken))
      .send({
        title: 'Learner Attempt',
        description: 'Should be forbidden',
        category: 'Web Development',
        level: 'beginner',
        duration: 2,
        price: 0
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Access denied');
  });

  it('blocks non-admin user listing endpoint', async () => {
    const res = await request(app)
      .get('/api/users')
      .set(authHeader(ownerFacultyToken));

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Access denied');
  });

  it('blocks faculty from approving enrollment', async () => {
    const res = await request(app)
      .put(`/api/courses/${courseId}/approve/${learnerId}`)
      .set(authHeader(ownerFacultyToken));

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Access denied');
  });

  it('blocks unapproved learner progress updates', async () => {
    const res = await request(app)
      .put(`/api/courses/${courseId}/progress`)
      .set(authHeader(learnerToken))
      .send({ lectureId, completed: true });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Only approved learners can track progress');
  });

  it('blocks unapproved learner assignment submissions', async () => {
    const res = await request(app)
      .post(`/api/courses/${courseId}/assignments/${assignmentId}/submit`)
      .set(authHeader(learnerToken))
      .send({ textAnswer: 'Should fail while pending' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Only approved learners can submit');
  });

  it('blocks learner grading endpoint and non-instructor reopen endpoint', async () => {
    const approveRes = await request(app)
      .put(`/api/courses/${courseId}/approve/${learnerId}`)
      .set(authHeader(adminToken));
    expect(approveRes.statusCode).toBe(200);

    const submitRes = await request(app)
      .post(`/api/courses/${courseId}/assignments/${assignmentId}/submit`)
      .set(authHeader(learnerToken))
      .send({ textAnswer: 'Now approved, first submission' });
    expect(submitRes.statusCode).toBe(200);

    const learnerGradeAttempt = await request(app)
      .put(`/api/courses/${courseId}/assignments/${assignmentId}/grade/${learnerId}`)
      .set(authHeader(learnerToken))
      .send({ score: 90, feedback: 'Learner should not grade' });
    expect(learnerGradeAttempt.statusCode).toBe(403);
    expect(learnerGradeAttempt.body.message).toBe('Access denied');

    const otherFacultyReopenAttempt = await request(app)
      .delete(`/api/courses/${courseId}/assignments/${assignmentId}/submissions/${learnerId}`)
      .set(authHeader(otherFacultyToken));
    expect(otherFacultyReopenAttempt.statusCode).toBe(403);
    expect(otherFacultyReopenAttempt.body.message).toBe('Access denied');
  });
});
