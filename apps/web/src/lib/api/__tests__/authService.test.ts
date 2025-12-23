import { authService } from '../api/authService';
import { apiClient } from '../api/client';

// Mock the API client
jest.mock('../api/client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login user and store tokens', async () => {
      const mockResponse = {
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: { id: '1', email: 'test@example.com' },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'access_token',
        'mock-access-token'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'refresh_token',
        'mock-refresh-token'
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('register', () => {
    it('should register user and store tokens', async () => {
      const mockResponse = {
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: { id: '2', email: 'newuser@example.com' },
        },
      };

      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
        role: 'client',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
        role: 'client',
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'access_token',
        'mock-access-token'
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'refresh_token',
        'mock-refresh-token'
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user', async () => {
      const mockUser = { id: '1', email: 'test@example.com', firstName: 'Test' };
      const mockResponse = { data: mockUser };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authService.getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should clear tokens from localStorage', async () => {
      await authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    });
  });
});