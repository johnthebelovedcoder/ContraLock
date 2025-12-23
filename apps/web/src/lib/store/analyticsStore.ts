import { create } from 'zustand';
import { adminService } from '@/lib/api/adminService';

interface AnalyticsState {
  platformOverview: any;
  timelineData: any[];
  loading: boolean;
  error: string | null;

  getPlatformOverview: () => Promise<void>;
  getTimelineAnalytics: (timeframe?: string) => Promise<any>;
  clearError: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  platformOverview: null,
  timelineData: [],
  loading: false,
  error: null,

  getPlatformOverview: async () => {
    set({ loading: true, error: null });
    try {
      const data = await adminService.getAnalyticsSummary();
      set({ platformOverview: data, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch analytics', loading: false });
      throw error;
    }
  },

  getTimelineAnalytics: async (timeframe = 'monthly') => {
    set({ loading: true, error: null });
    try {
      // For now, return empty data until we implement the timeline endpoint
      const data = [];
      set({ timelineData: data, loading: false });
      return data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch timeline analytics', loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));