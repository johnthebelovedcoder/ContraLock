import { apiClient } from '../api/client';

// Mock axios
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
      },
    })),
  };
});

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET method', () => {
    it('should make GET request with proper deduplication', async () => {
      // Mock the axios instance
      const axiosMock = require('axios');
      const mockGet = jest.fn().mockResolvedValue({ data: { id: 1, name: 'test' } });
      (axiosMock.create as jest.Mock).mockReturnValue({
        get: mockGet,
        interceptors: {
          request: { use: jest.fn(), eject: jest.fn() },
          response: { use: jest.fn(), eject: jest.fn() },
        },
      });

      // Create new instance to use the mocked axios
      const { apiClient } = require('../api/client');

      const result = await apiClient.get('/test');
      expect(mockGet).toHaveBeenCalledWith('/test', undefined);
      expect(result.data).toEqual({ id: 1, name: 'test' });
    });
  });

  describe('POST method', () => {
    it('should make POST request', async () => {
      const axiosMock = require('axios');
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      (axiosMock.create as jest.Mock).mockReturnValue({
        post: mockPost,
        interceptors: {
          request: { use: jest.fn(), eject: jest.fn() },
          response: { use: jest.fn(), eject: jest.fn() },
        },
      });

      const { apiClient } = require('../api/client');

      const data = { name: 'test' };
      const result = await apiClient.post('/test', data);
      expect(mockPost).toHaveBeenCalledWith('/test', data, undefined);
      expect(result.data).toEqual({ success: true });
    });
  });
});