import { UserAuth, User } from '@/types';
import { apiClient } from './client';
import { handleApiError, logError } from '../utils/errorHandler';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'freelancer';
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  portfolioLinks?: string[];
  preferredCurrency?: string;
}

class AuthService {
  // Track the last time login was called to prevent rapid calls
  private lastLoginCall = 0;
  private currentLoginPromise: Promise<UserAuth> | null = null;

  async login(credentials: LoginCredentials): Promise<UserAuth> {
    const now = Date.now();
    // Prevent login attempts more than once every 3 seconds
    if (now - this.lastLoginCall < 3000 && this.currentLoginPromise) {
      // Return the existing promise if we're still waiting for the previous one
      return this.currentLoginPromise;
    }

    this.lastLoginCall = now;

    // Make a new login request
    this.currentLoginPromise = this.makeLoginRequestWithBackoff(credentials, 3); // Try up to 3 times with backoff

    return this.currentLoginPromise;
  }

  private async makeLoginRequestWithBackoff(credentials: LoginCredentials, maxRetries: number): Promise<UserAuth> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await apiClient.post('/auth/login', credentials);
        const { data } = response;

        // Store tokens
        if (data.accessToken) {
          localStorage.setItem('access_token', data.accessToken);
        }
        if (data.refreshToken) {
          localStorage.setItem('refresh_token', data.refreshToken);
        }

        this.currentLoginPromise = null;
        return data;
      } catch (error: any) {
        lastError = error;

        // Check if it's a rate limit error
        if (error.response?.status === 429 && attempt < maxRetries - 1) {
          // Calculate backoff time (exponential backoff: 1s, 2s, 4s, etc.)
          const backoffTime = Math.pow(2, attempt) * 1000;
          console.warn(`Rate limited on login, waiting ${backoffTime}ms before retry ${attempt + 1}/${maxRetries}`);

          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        } else if (attempt < maxRetries - 1) {
          // It's not a 429 error but we still have retries left
          await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for non-429 errors
          continue;
        } else {
          // If it's not a 429 error or we've exhausted retries, break the loop
          break;
        }
      }
    }

    // If we get here, all retries failed
    this.currentLoginPromise = null;
    logError(lastError, 'AUTH_LOGIN');
    throw lastError;
  }

  async register(userData: RegisterData): Promise<UserAuth> {
    try {
      const response = await apiClient.post('/auth/register', userData);
      const { data } = response;

      // Store tokens
      if (data.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken);
      }

      return data;
    } catch (error) {
      logError(error, 'AUTH_REGISTER');
      throw error;
    }
  }

  async logout(): Promise<void> {
    // Remove tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Any additional logout logic
    // This could include calling an API endpoint to invalidate the session
  }

  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', data);
    } catch (error) {
      logError(error, 'AUTH_FORGOT_PASSWORD');
      throw error;
    }
  }

  async resetPassword(data: ResetPasswordData): Promise<UserAuth> {
    try {
      const response = await apiClient.post('/auth/reset-password', data);
      const { data: result } = response;

      // Store tokens
      if (result.accessToken) {
        localStorage.setItem('access_token', result.accessToken);
      }
      if (result.refreshToken) {
        localStorage.setItem('refresh_token', result.refreshToken);
      }

      return result;
    } catch (error) {
      logError(error, 'AUTH_RESET_PASSWORD');
      throw error;
    }
  }

  async verifyEmail(token: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post('/auth/verify-email', { token });
      return response.data;
    } catch (error) {
      logError(error, 'AUTH_VERIFY_EMAIL');
      throw error;
    }
  }

  // Track the last time refreshToken was called to prevent rapid calls
  private lastRefreshTokenCall = 0;
  private currentRefreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const now = Date.now();
    // Prevent refresh token attempts more than once every 5 seconds
    if (now - this.lastRefreshTokenCall < 5000 && this.currentRefreshPromise) {
      // Return the existing promise if we're still waiting for the previous one
      return this.currentRefreshPromise;
    }

    this.lastRefreshTokenCall = now;

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Make a new refresh request with retry logic
    this.currentRefreshPromise = this.makeRefreshTokenRequestWithBackoff(refreshToken, 3); // Try up to 3 times with backoff

    return this.currentRefreshPromise;
  }

  private async makeRefreshTokenRequestWithBackoff(refreshToken: string, maxRetries: number): Promise<{ accessToken: string; refreshToken: string }> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await apiClient.post('/auth/refresh', { refreshToken });
        const { data } = response;

        // Update tokens
        if (data.accessToken) {
          localStorage.setItem('access_token', data.accessToken);
        }
        if (data.refreshToken) {
          localStorage.setItem('refresh_token', data.refreshToken);
        }

        this.currentRefreshPromise = null;
        return data;
      } catch (error: any) {
        lastError = error;

        // Check if it's a rate limit error
        if (error.response?.status === 429 && attempt < maxRetries - 1) {
          // Calculate backoff time (exponential backoff: 1s, 2s, 4s, etc.)
          const backoffTime = Math.pow(2, attempt) * 1000;
          console.warn(`Rate limited on refresh token, waiting ${backoffTime}ms before retry ${attempt + 1}/${maxRetries}`);

          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        } else if (attempt < maxRetries - 1) {
          // It's not a 429 error but we still have retries left
          await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for non-429 errors
          continue;
        } else {
          // If it's not a 429 error or we've exhausted retries, break the loop
          break;
        }
      }
    }

    // If we get here, all retries failed
    this.currentRefreshPromise = null;
    logError(lastError, 'AUTH_REFRESH_TOKEN');
    throw lastError;
  }

  // Track the last time getCurrentUser was called to prevent rapid calls
  private lastGetCurrentUserCall = 0;
  private currentGetUserPromise: Promise<User> | null = null;

  async getCurrentUser(): Promise<User> {
    const now = Date.now();
    // Prevent fetching user more than once every 2 seconds
    if (now - this.lastGetCurrentUserCall < 2000 && this.currentGetUserPromise) {
      // Return the existing promise if we're still waiting for the previous one
      return this.currentGetUserPromise;
    }

    this.lastGetCurrentUserCall = now;

    // Make a new request with retry logic
    this.currentGetUserPromise = this.makeGetCurrentUserRequestWithBackoff(3); // Try up to 3 times with backoff

    return this.currentGetUserPromise;
  }

  private async makeGetCurrentUserRequestWithBackoff(maxRetries: number): Promise<User> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await apiClient.get('/auth/me');
        this.currentGetUserPromise = null;
        return response.data;
      } catch (error: any) {
        lastError = error;

        // Check if it's a rate limit error
        if (error.response?.status === 429 && attempt < maxRetries - 1) {
          // Calculate backoff time (exponential backoff: 1s, 2s, 4s, etc.)
          const backoffTime = Math.pow(2, attempt) * 1000;
          console.warn(`Rate limited on getUser, waiting ${backoffTime}ms before retry ${attempt + 1}/${maxRetries}`);

          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        } else if (attempt < maxRetries - 1) {
          // It's not a 429 error but we still have retries left
          await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for non-429 errors
          continue;
        } else {
          // If it's not a 429 error or we've exhausted retries, break the loop
          break;
        }
      }
    }

    // If we get here, all retries failed
    this.currentGetUserPromise = null;
    logError(lastError, 'AUTH_GET_CURRENT_USER');
    throw lastError;
  }

  async updateProfile(profileData: UpdateProfileData): Promise<User> {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      logError(error, 'AUTH_UPDATE_PROFILE');
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      logError(error, 'AUTH_CHANGE_PASSWORD');
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  async signInWithSocial(provider: 'google' | 'linkedin', idToken?: string, code?: string): Promise<UserAuth> {
    try {
      // Different endpoints for different providers
      let endpoint, requestData;

      if (provider === 'google' && idToken) {
        endpoint = '/auth/social/google';
        requestData = { idToken };
      } else if (provider === 'linkedin' && code) {
        endpoint = '/auth/social/linkedin';
        requestData = { code };
      } else {
        throw new Error('Invalid provider or missing credential');
      }

      const response = await apiClient.post(endpoint, requestData);
      const { data } = response;

      // Store tokens
      if (data.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken);
      }

      return data;
    } catch (error) {
      logError(error, `AUTH_SOCIAL_LOGIN_${provider.toUpperCase()}`);
      throw error;
    }
  }
}

export const authService = new AuthService();