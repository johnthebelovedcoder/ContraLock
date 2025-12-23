// Mock-enabled API client
// Can use real API or mock data based on configuration

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { handleApiError, logError } from '../utils/errorHandler';
import { 
  mockApiService,
  getMockProjects,
  getMockMilestones,
  getMockTransactions,
  getMockNotifications
} from '../mock-api';

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

// Create a unique key for each request to identify duplicates
function getRequestKey(url: string, method: string, data?: any): string {
  const normalizedMethod = method.toUpperCase();
  // For GET requests, we only consider URL since they shouldn't have request body
  // For other methods, we also consider the data
  if (normalizedMethod === 'GET') {
    return `${normalizedMethod}-${url}`;
  }

  // For other methods, include the data to differentiate requests to the same endpoint
  // but with different payloads
  const dataString = data ? JSON.stringify(data) : '';
  return `${normalizedMethod}-${url}-${dataString}`;
}

// Configuration to enable/disable mock mode
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || false;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        logError(error, 'API_REQUEST');
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle common errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Log the error for debugging
        logError(error, 'API_RESPONSE');

        // Handle unauthorized access
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // Don't redirect if using mock data
          if (!USE_MOCK_DATA) {
            window.location.href = '/auth/login';
          }
        }

        // Let the calling function handle the error
        return Promise.reject(error);
      }
    );
  }

  // Generic request methods with mock support
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    if (USE_MOCK_DATA) {
      // Use mock service for certain endpoints
      if (url.includes('/projects')) {
        // Simulate the API response structure
        const projects = getMockProjects();
        return {
          data: {
            items: projects,
            total: projects.length,
            page: 1,
            limit: 10
          } as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      } else if (url.includes('/notifications')) {
        const notifications = getMockNotifications();
        return {
          data: notifications as any,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      }
      // Add more mock endpoints as needed
    }

    // For GET requests, implement deduplication
    const requestKey = getRequestKey(url, 'GET');

    if (pendingRequests.has(requestKey)) {
      // If request is already in flight, return the existing promise
      return pendingRequests.get(requestKey);
    }

    // Make the new request
    const requestPromise = this.client.get<T>(url, config)
      .then(response => {
        // Clean up after request completes successfully
        pendingRequests.delete(requestKey);
        return response;
      })
      .catch(error => {
        // Clean up after request fails
        pendingRequests.delete(requestKey);
        const processedError = handleApiError(error);
        // Re-throw with processed error data
        return Promise.reject(processedError);
      });

    // Store the pending promise
    pendingRequests.set(requestKey, requestPromise);

    return requestPromise;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    if (USE_MOCK_DATA) {
      // Handle specific POST endpoints with mocks if needed
      if (url.includes('/projects')) {
        // Simulate project creation
        return {
          data: {
            id: `proj-${Date.now()}`,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as any,
          status: 201,
          statusText: 'Created',
          headers: {},
          config: config || {}
        } as AxiosResponse<T>;
      }
    }

    try {
      return await this.client.post<T>(url, data, config);
    } catch (error) {
      const processedError = handleApiError(error);
      return Promise.reject(processedError);
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    if (USE_MOCK_DATA) {
      // Handle specific PUT endpoints with mocks if needed
    }

    try {
      return await this.client.put<T>(url, data, config);
    } catch (error) {
      const processedError = handleApiError(error);
      return Promise.reject(processedError);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    if (USE_MOCK_DATA) {
      // Handle specific DELETE endpoints with mocks if needed
    }

    try {
      return await this.client.delete<T>(url, config);
    } catch (error) {
      const processedError = handleApiError(error);
      return Promise.reject(processedError);
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    if (USE_MOCK_DATA) {
      // Handle specific PATCH endpoints with mocks if needed
    }

    try {
      return await this.client.patch<T>(url, data, config);
    } catch (error) {
      const processedError = handleApiError(error);
      return Promise.reject(processedError);
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;