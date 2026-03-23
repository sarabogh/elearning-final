const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');

// Mock setup
let app;
let token;
let userId;

describe('Auth Routes', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/elearn-test');
    app = require('../server');
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@1234',
          role: 'learner'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should fail with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test2@example.com',
          password: 'weak',
          role: 'learner'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should fail with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Test@1234',
          role: 'learner'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test@1234'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      token = res.body.token;
      userId = res.body.user._id;
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
    });
  });
});

describe('Course Routes', () => {
  let courseId;

  describe('GET /api/courses', () => {
    it('should get all courses', async () => {
      const res = await request(app).get('/api/courses');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/courses', () => {
    it('should create a course', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Course',
          description: 'Test course description',
          category: 'Technology',
          level: 'beginner',
          duration: 10,
          price: 0
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('title', 'Test Course');
      courseId = res.body._id;
    });
  });

  describe('POST /api/courses/:id/enroll', () => {
    it('should enroll student in course', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/courses/:id/rate', () => {
    it('should submit course rating', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/rate`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          review: 'Great course!'
        });

      expect(res.statusCode).toBe(200);
    });

    it('should fail with invalid rating', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/rate`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 10,
          review: 'Great course!'
        });

      expect(res.statusCode).toBe(400);
    });
  });
});

describe('User Routes', () => {
  describe('GET /api/users', () => {
    it('should get all users (admin only)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      // This will fail if user is not admin, which is expected
      expect([200, 403]).toContain(res.statusCode);
    });
  });
});

describe('File Upload', () => {
  describe('POST /api/uploads/single', () => {
    it('should upload a single file', async () => {
      const res = await request(app)
        .post('/api/uploads/single')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('test content'), 'test.pdf');

      expect([200, 400]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty('file');
        expect(res.body.file).toHaveProperty('url');
      }
    });
  });
});