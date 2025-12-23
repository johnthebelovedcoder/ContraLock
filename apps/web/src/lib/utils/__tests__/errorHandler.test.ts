// apps/web/src/lib/utils/__tests__/errorHandler.test.ts
import { 
  FrontendError, 
  handleApiError, 
  getErrorMessage, 
  formatValidationErrors, 
  logError 
} from '../errorHandler';

describe('Frontend Error Handler', () => {
  describe('FrontendError Class', () => {
    test('should create a FrontendError with correct properties', () => {
      const error = new FrontendError('Test error', 400, { field: 'email' });
      
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
      expect(error.name).toBe('FrontendError');
    });

    test('should create a FrontendError without status and details', () => {
      const error = new FrontendError('Simple error');
      
      expect(error.message).toBe('Simple error');
      expect(error.status).toBeUndefined();
      expect(error.details).toBeUndefined();
    });
  });

  describe('handleApiError Function', () => {
    test('should handle network errors', () => {
      const error = { response: null, message: 'Network Error' };
      const result = handleApiError(error);

      expect(result.message).toBe('Network error. Please check your connection.');
      expect(result.details).toBe('Network Error');
    });

    test('should handle 400 Bad Request', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Bad request', errors: ['Invalid input'] }
        }
      };
      const result = handleApiError(error);

      expect(result.message).toBe('Bad request');
      expect(result.status).toBe(400);
      expect(result.details).toEqual(['Invalid input']);
    });

    test('should handle 401 Unauthorized', () => {
      // Mock localStorage
      const localStorageMock = {
        removeItem: jest.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      });

      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      });

      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };
      const result = handleApiError(error);

      expect(result.message).toBe('Session expired. Please log in again.');
      expect(result.status).toBe(401);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    });

    test('should handle 404 Not Found', () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Not found' }
        }
      };
      const result = handleApiError(error);

      expect(result.message).toBe('Not found');
      expect(result.status).toBe(404);
    });

    test('should handle 500 Internal Server Error', () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Server error' }
        }
      };
      const result = handleApiError(error);

      expect(result.message).toBe('Server error');
      expect(result.status).toBe(500);
    });

    test('should handle default error', () => {
      const error = {
        response: {
          status: 418, // I'm a teapot, for testing default case
          data: { message: 'Teapot error' }
        }
      };
      const result = handleApiError(error);

      expect(result.message).toBe('Teapot error');
      expect(result.status).toBe(418);
    });
  });

  describe('getErrorMessage Function', () => {
    test('should return message from FrontendError', () => {
      const error = new FrontendError('Custom error');
      const message = getErrorMessage(error);

      expect(message).toBe('Custom error');
    });

    test('should return response data message', () => {
      const error = {
        response: {
          data: { message: 'API error' }
        }
      };
      const message = getErrorMessage(error);

      expect(message).toBe('API error');
    });

    test('should return error message property', () => {
      const error = { message: 'Simple error' };
      const message = getErrorMessage(error);

      expect(message).toBe('Simple error');
    });

    test('should return fallback message', () => {
      const error = {};
      const message = getErrorMessage(error);

      expect(message).toBe('An unexpected error occurred');
    });
  });

  describe('formatValidationErrors Function', () => {
    test('should format array of validation errors', () => {
      const errors = [
        { msg: 'Email is required' },
        { msg: 'Password too short' }
      ];
      const formatted = formatValidationErrors(errors);

      expect(formatted).toEqual(['Email is required', 'Password too short']);
    });

    test('should format object of validation errors', () => {
      const errors = {
        email: [{ msg: 'Invalid email' }],
        password: [{ msg: 'Too short' }, { msg: 'No number' }]
      };
      const formatted = formatValidationErrors(errors);

      expect(formatted).toEqual(['Invalid email', 'Too short', 'No number']);
    });

    test('should return empty array for null/undefined', () => {
      expect(formatValidationErrors(null)).toEqual([]);
      expect(formatValidationErrors(undefined)).toEqual([]);
    });
  });

  describe('logError Function', () => {
    test('should log error to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const error = new Error('Test error');
      logError(error, 'TEST_CONTEXT');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Error - TEST_CONTEXT]', 
        expect.objectContaining({
          message: 'Test error',
          timestamp: expect.any(String)
        })
      );

      consoleSpy.mockRestore();
    });

    test('should include response and request data if available', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const error = {
        message: 'API Error',
        stack: 'Stack trace',
        response: {
          status: 500,
          data: { message: 'Server error' },
          headers: { 'content-type': 'application/json' }
        },
        config: {
          method: 'POST',
          url: '/api/test',
          data: { test: 'data' }
        }
      };
      logError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Error]', 
        expect.objectContaining({
          message: 'API Error',
          response: expect.objectContaining({
            status: 500,
            data: { message: 'Server error' }
          }),
          request: expect.objectContaining({
            method: 'POST',
            url: '/api/test'
          })
        })
      );

      consoleSpy.mockRestore();
    });
  });
});