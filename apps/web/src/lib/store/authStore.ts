import { create } from 'zustand';
import { User } from '@/types';
import { authService } from '../api/authService';
import { getErrorMessage } from '../utils/errorHandler';

// Track the last time auth was initialized to prevent rapid calls
let lastAuthInit = 0;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, role: 'client' | 'freelancer') => Promise<void>;
  logout: () => void;
  initializeAuth: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  clearError: () => void;
  signInWithSocial: (provider: 'google' | 'linkedin', idToken?: string, code?: string) => Promise<void>;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      // The authService already stores tokens in localStorage
      // Now get the current user to update the store
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, loading: false });
    } catch (error: any) {
      const message = getErrorMessage(error);
      set({ error: message, loading: false });
      throw error;
    }
  },

  register: async (email, password, firstName, lastName, role) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.register({ email, password, firstName, lastName, role });
      // The authService already stores tokens in localStorage
      // Now get the current user to update the store
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, loading: false });
    } catch (error: any) {
      const message = getErrorMessage(error);
      set({ error: message, loading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false, loading: false, error: null });
  },

  // Rate-limited version of initializeAuth to prevent rapid calls
  initializeAuth: async () => {
    const now = Date.now();
    // Prevent initializing auth more than once every 2 seconds
    if (now - lastAuthInit < 2000) {
      return;
    }

    lastAuthInit = now;

    set({ loading: true });
    try {
      const token = localStorage.getItem('access_token');
      if (token && authService.isAuthenticated()) {
        try {
          // Try to get current user from the backend
          const user = await authService.getCurrentUser();
          set({ user, isAuthenticated: true, error: null });
        } catch (error: any) {
          // If getting user fails, the token might be invalid
          // Clear the stored token and set proper state
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({ user: null, isAuthenticated: false, error: null });
        }
      } else {
        set({ user: null, isAuthenticated: false, error: null });
      }
    } catch (error: any) {
      // Handle any other errors during initialization
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, error: null }); // Don't set error during initialization to avoid UI issues
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (profileData) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.updateProfile(profileData);
      set({ user, loading: false });
    } catch (error: any) {
      const message = getErrorMessage(error);
      set({ error: message, loading: false });
      throw error;
    }
  },

  verifyEmail: async (token: string) => {
    set({ loading: true, error: null });
    try {
      await authService.verifyEmail(token);
      // After email verification, get the current user to update the store
      const user = await authService.getCurrentUser();
      set({ user, loading: false });
    } catch (error: any) {
      const message = getErrorMessage(error);
      set({ error: message, loading: false });
      throw error;
    }
  },

  signInWithSocial: async (provider, idToken, code) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.signInWithSocial(provider, idToken, code);
      // The authService already stores tokens in localStorage
      // Now get the current user to update the store
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: true, loading: false });
    } catch (error: any) {
      const message = getErrorMessage(error);
      set({ error: message, loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  setUser: (user) => set({ user }),

  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
}));