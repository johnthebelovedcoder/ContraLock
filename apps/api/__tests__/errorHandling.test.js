// apps/api/__tests__/errorHandling.test.js
const request = require('supertest');
const app = require('../src/index');
const { AppError, BadRequestError, UnauthorizedError, NotFoundError } = require('../src/errors/AppError');

describe('Error Handling System', () => {
  describe('AppError Class', () => {
    test('should create an AppError with correct properties', () => {
      const error = new AppError('Test error', 400);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.status).toBe('fail');
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    test('should create different types of specific errors', () => {
      const badRequestError = new BadRequestError('Bad request');
      const unauthorizedError = new UnauthorizedError('Unauthorized');
      const notFoundError = new NotFoundError('Not found');

      expect(badRequestError.statusCode).toBe(400);
      expect(unauthorizedError.statusCode).toBe(401);
      expect(notFoundError.statusCode).toBe(404);
    });

    test('should handle validation errors with custom errors', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];
      const validationError = new (require('../src/errors/AppError').ValidationError)('Validation failed', errors);

      expect(validationError.statusCode).toBe(422);
      expect(validationError.errors).toEqual(errors);
    });
  });

  describe('Async Handler Middleware', () => {
    test('should catch errors from async route handlers', async () => {
      // Create a route that throws an error
      app.get('/test-error', (req, res, next) => {
        const asyncHandler = require('../src/middleware/asyncHandler');
        return asyncHandler(async () => {
          throw new AppError('Test error', 500);
        })(req, res, next);
      });

      const response = await request(app)
        .get('/test-error')
        .expect(500);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toBe('Test error');
    });
  });

  describe('Global Error Handler', () => {
    test('should handle AppError correctly', () => {
      const { globalErrorHandler } = require('../src/middleware/errorHandler');
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();
      
      const error = new AppError('Test error', 400);
      globalErrorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Test error'
      });
    });

    test('should handle Mongoose CastError', () => {
      const { globalErrorHandler } = require('../src/middleware/errorHandler');
      const mockReq = {
        originalUrl: '/test',
        method: 'GET',
        ip: '127.0.0.1',
        get: () => 'test-agent'
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();
      
      const error = { name: 'CastError', message: 'Cast to ObjectId failed' };
      globalErrorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Resource not found'
      });
    });

    test('should handle duplicate key errors', () => {
      const { globalErrorHandler } = require('../src/middleware/errorHandler');
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();
      
      const error = { 
        code: 11000, 
        keyValue: { email: 'test@example.com' } 
      };
      globalErrorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Duplicate field value: email'
      });
    });

    test('should handle validation errors', () => {
      const { globalErrorHandler } = require('../src/middleware/errorHandler');
      const mockReq = {};
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();
      
      const error = { 
        name: 'ValidationError', 
        errors: { 
          email: { message: 'Invalid email format' },
          name: { message: 'Name is required' }
        }
      };
      globalErrorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'Invalid email format, Name is required'
      });
    });
  });

  describe('Not Found Handler', () => {
    test('should handle 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/this-route-does-not-exist')
        .expect(404);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Route /this-route-does-not-exist not found');
    });
  });

  describe('API Route Error Handling', () => {
    test('should handle validation errors in auth routes', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email', // Invalid email
          password: 'short',      // Too short
          firstName: '',          // Too short
          lastName: 'Test',
          role: 'invalid-role'    // Invalid role
        })
        .expect(422);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Validation failed');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    test('should handle unauthorized errors in protected routes', async () => {
      const response = await request(app)
        .get('/projects')
        .expect(401);

      expect(response.body.status).toBe('fail');
      expect(response.body.message).toBe('Unauthorized');
    });
  });
});