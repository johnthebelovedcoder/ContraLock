import { create } from 'zustand';
import { Dispute } from '@/types';
import { messagingService } from '../api/messagingService';
import { projectService } from '../api/projectService';
import { mockDisputeService } from '../mock-dispute-service';
import { isMockMode } from '@/config/app-config';

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
      let disputes: Dispute[];
      if (isMockMode) {
        disputes = await mockDisputeService.getUserDisputes(userId || '', status);
      } else {
        disputes = await messagingService.getDisputes(userId, status);
      }
      set({ disputes, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch disputes', loading: false });
      throw error;
    }
  },
  fetchDisputes: async (userId, status) => {
    set({ loading: true, error: null });
    try {
      let disputes: Dispute[];
      if (isMockMode) {
        disputes = await mockDisputeService.getUserDisputes(userId, status);
      } else {
        disputes = await messagingService.getDisputes(userId, status);
      }
      set({ disputes, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch disputes', loading: false });
      throw error;
    }
  },

  createDispute: async (milestoneId, disputeData) => {
    set({ loading: true, error: null });
    try {
      let newDispute: Dispute;
      if (isMockMode) {
        newDispute = await mockDisputeService.createDispute({
          ...disputeData,
          milestone: milestoneId
        });
      } else {
        newDispute = await projectService.disputeMilestone(milestoneId, disputeData);
      }
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
      let updatedDispute: Dispute;
      if (isMockMode) {
        // For mock mode, we'll update the dispute in the mock service
        // In a real implementation, we'd have a method to update disputes
        const allDisputes = await mockDisputeService.getUserDisputes('');
        const dispute = allDisputes.find(d => d._id === disputeId);
        if (!dispute) {
          throw new Error('Dispute not found');
        }
        updatedDispute = { ...dispute, ...updateData } as Dispute;
      } else {
        // Implementation would go here for real API
        set((state) => ({
          disputes: state.disputes.map(dispute =>
            dispute._id === disputeId ? { ...dispute, ...updateData } : dispute
          ),
          loading: false,
        }));
        return updateData as Dispute;
      }
      set((state) => ({
        disputes: state.disputes.map(dispute =>
          dispute._id === disputeId ? updatedDispute : dispute
        ),
        loading: false,
      }));
      return updatedDispute;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update dispute', loading: false });
      throw error;
    }
  },

  resolveDispute: async (disputeId, resolutionData) => {
    set({ loading: true, error: null });
    try {
      let resolvedDispute: Dispute;
      if (isMockMode) {
        // In mock mode, we'll simulate the resolution
        const allDisputes = await mockDisputeService.getUserDisputes('');
        const dispute = allDisputes.find(d => d._id === disputeId);
        if (!dispute) {
          throw new Error('Dispute not found');
        }
        resolvedDispute = {
          ...dispute,
          status: 'RESOLVED',
          resolution: resolutionData
        } as Dispute;
      } else {
        // Implementation would go here for real API
        set((state) => ({
          disputes: state.disputes.map(dispute =>
            dispute._id === disputeId ? { ...dispute, status: 'RESOLVED', resolution: resolutionData } : dispute
          ),
          loading: false,
        }));
        return resolutionData as Dispute;
      }
      set((state) => ({
        disputes: state.disputes.map(dispute =>
          dispute._id === disputeId ? resolvedDispute : dispute
        ),
        loading: false,
      }));
      return resolvedDispute;
    } catch (error: any) {
      set({ error: error.message || 'Failed to resolve dispute', loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));