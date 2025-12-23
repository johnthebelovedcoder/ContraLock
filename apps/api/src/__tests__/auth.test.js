const request = require('supertest');
const app = require('../src/index'); // Adjust path to your main app file

describe('Auth API Endpoints', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'client'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully.');
      expect(response.body.userId).toBeDefined();
    });

    it('should return 400 for invalid input', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: 'short', // Too short
        firstName: 'Test',
        role: 'invalid-role' // Invalid role
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidUserData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 409 if user already exists', async () => {
      // First register a user
      await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'TestPassword123!',
          firstName: 'Existing',
          lastName: 'User',
          role: 'client'
        })
        .expect(201);

      // Try to register the same user again
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'AnotherPassword123!',
          firstName: 'Another',
          lastName: 'User',
          role: 'client'
        })
        .expect(409);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/login', () => {
    // Register a user first to login
    beforeAll(async () => {
      await request(app)
        .post('/auth/register')
        .send({
          email: 'login-test@example.com',
          password: 'TestPassword123!',
          firstName: 'Login',
          lastName: 'Test',
          role: 'client'
        });
    });

    it('should login an existing user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});