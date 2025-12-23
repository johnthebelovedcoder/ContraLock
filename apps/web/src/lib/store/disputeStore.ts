import { create } from 'zustand';
import { Dispute } from '@/types';
import { messagingService } from '../api/messagingService';
import { projectService } from '../api/projectService';

interface DisputeState {
  disputes: Dispute[];
  loading: boolean;
  error: string | null;

  getDisputes: (userId?: string, status?: string) => Promise<void>;
  fetchDisputes: (userId: string, status?: string) => Promise<void>;
  createDispute: (milestoneId: string, disputeData: any) => Promise<Dispute>;
  updateDispute: (disputeId: string, updateData: any) => Promise<Dispute>;
  resolveDispute: (disputeId: string, resolutionData: any) => Promise<Dispute>;
  clearError: () => void;
}

export const useDisputeStore = create<DisputeState>((set) => ({
  disputes: [],
  loading: false,
  error: null,

  getDisputes: async (userId, status) => {
    set({ loading: true, error: null });
    try {
      const disputes = await messagingService.getDisputes(userId, status);
      set({ disputes, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch disputes', loading: false });
      throw error;
    }
  },
  fetchDisputes: async (userId, status) => {
    set({ loading: true, error: null });
    try {
      const disputes = await messagingService.getDisputes(userId, status);
      set({ disputes, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch disputes', loading: false });
      throw error;
    }
  },

  createDispute: async (milestoneId, disputeData) => {
    set({ loading: true, error: null });
    try {
      const newDispute = await projectService.disputeMilestone(milestoneId, disputeData);
      set((state) => ({ disputes: [...state.disputes, newDispute], loading: false }));
      return newDispute;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create dispute', loading: false });
      throw error;
    }
  },

  updateDispute: async (disputeId, updateData) => {
    set({ loading: true, error: null });
    try {
      // Implementation would go here
      set((state) => ({
        disputes: state.disputes.map(dispute =>
          dispute.id === disputeId ? { ...dispute, ...updateData } : dispute
        ),
        loading: false,
      }));
      return updateData as Dispute;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update dispute', loading: false });
      throw error;
    }
  },

  resolveDispute: async (disputeId, resolutionData) => {
    set({ loading: true, error: null });
    try {
      // Implementation would go here
      set((state) => ({
        disputes: state.disputes.map(dispute =>
          dispute.id === disputeId ? { ...dispute, status: 'resolved', resolution: resolutionData } : dispute
        ),
        loading: false,
      }));
      return resolutionData as Dispute;
    } catch (error: any) {
      set({ error: error.message || 'Failed to resolve dispute', loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));