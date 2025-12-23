import { create } from 'zustand';
import { User } from '@/types';
import { adminService } from '@/lib/api/adminService';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  getUsers: (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) => Promise<void>;
  fetchUsers: (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserStatus: (userId: string, status: string) => Promise<void>;
  clearError: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  },

  getUsers: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await adminService.getUsers(params);
      set({
        users: data.items || [],
        pagination: data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch users', loading: false });
      throw error;
    }
  },

  fetchUsers: async (params = {}) => {
    return await useUserStore.getState().getUsers(params);
  },

  updateUserStatus: async (userId, status) => {
    set({ loading: true, error: null });
    try {
      await adminService.updateUserStatus(userId, status);
      // Refresh the user list
      const currentParams = { page: useUserStore.getState().pagination.page, limit: useUserStore.getState().pagination.limit };
      await useUserStore.getState().getUsers(currentParams);
    } catch (error: any) {
      set({ error: error.message || 'Failed to update user status', loading: false });
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    set({ loading: true, error: null });
    try {
      // This would need a new API endpoint in adminService
      // For now, we'll throw an error since the endpoint doesn't exist
      throw new Error('Update user endpoint not implemented');
    } catch (error: any) {
      set({ error: error.message || 'Failed to update user', loading: false });
      throw error;
    }
  },

  deleteUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      // This would need a new API endpoint in adminService
      // For now, we'll throw an error since the endpoint doesn't exist
      throw new Error('Delete user endpoint not implemented');
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete user', loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));