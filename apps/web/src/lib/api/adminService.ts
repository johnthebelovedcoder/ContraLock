import { apiClient } from './client';

export const adminService = {
  // Admin Dashboard endpoints
  getDashboard: async () => {
    const response = await apiClient.get('/admin/dashboard');
    return response.data;
  },
  
  // User Management endpoints
  getUsers: async (params: { page?: number; limit?: number; role?: string; status?: string; search?: string } = {}) => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },
  
  getUser: async (userId: string) => {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },
  
  updateUserStatus: async (userId: string, status: string) => {
    const response = await apiClient.put(`/admin/users/${userId}/status`, { status });
    return response.data;
  },
  
  // Project Management endpoints
  getProjects: async (params: { page?: number; limit?: number; status?: string; client?: string; freelancer?: string; search?: string } = {}) => {
    const response = await apiClient.get('/admin/projects', { params });
    return response.data;
  },
  
  getProject: async (projectId: string) => {
    const response = await apiClient.get(`/admin/projects/${projectId}`);
    return response.data;
  },
  
  getDispute: async (disputeId: string) => {
    const response = await apiClient.get(`/admin/disputes/${disputeId}`);
    return response.data;
  },

  // Analytics endpoints (these may already exist in analyticsService)
  getAnalyticsSummary: async () => {
    const response = await apiClient.get('/admin/analytics/summary');
    return response.data;
  },

  // Transaction Management endpoints
  getTransactions: async (params: { page?: number; limit?: number; type?: string; status?: string; search?: string } = {}) => {
    const response = await apiClient.get('/admin/transactions', { params });
    return response.data;
  }
};