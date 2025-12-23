import { create } from 'zustand';
import { 
  aiService, 
  MilestoneSuggestionRequest, 
  MilestoneSuggestionResponse,
  DeliverableVerificationRequest,
  DeliverableVerificationResponse,
  DisputeAnalysisRequest,
  DisputeAnalysisResponse
} from '../api/aiService';

interface AIState {
  // Milestone suggestions
  milestoneSuggestions: MilestoneSuggestionResponse | null;
  milestoneSuggestionsLoading: boolean;
  milestoneSuggestionsError: string | null;
  
  // Deliverable verification
  deliverableVerification: DeliverableVerificationResponse | null;
  deliverableVerificationLoading: boolean;
  deliverableVerificationError: string | null;
  
  // Dispute analysis
  disputeAnalysis: DisputeAnalysisResponse | null;
  disputeAnalysisLoading: boolean;
  disputeAnalysisError: string | null;
  
  // General AI state
  loading: boolean;
  error: string | null;

  // Actions for milestone suggestions
  getMilestoneSuggestions: (data: MilestoneSuggestionRequest) => Promise<MilestoneSuggestionResponse>;
  clearMilestoneSuggestions: () => void;
  
  // Actions for deliverable verification
  verifyDeliverable: (data: DeliverableVerificationRequest) => Promise<DeliverableVerificationResponse>;
  clearDeliverableVerification: () => void;
  
  // Actions for dispute analysis
  analyzeDispute: (data: DisputeAnalysisRequest) => Promise<DisputeAnalysisResponse>;
  clearDisputeAnalysis: () => void;
  
  // General actions
  clearError: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  // Milestone suggestions
  milestoneSuggestions: null,
  milestoneSuggestionsLoading: false,
  milestoneSuggestionsError: null,
  
  // Deliverable verification
  deliverableVerification: null,
  deliverableVerificationLoading: false,
  deliverableVerificationError: null,
  
  // Dispute analysis
  disputeAnalysis: null,
  disputeAnalysisLoading: false,
  disputeAnalysisError: null,
  
  // General
  loading: false,
  error: null,

  // Actions for milestone suggestions
  getMilestoneSuggestions: async (data) => {
    set({ milestoneSuggestionsLoading: true, milestoneSuggestionsError: null });
    try {
      const result = await aiService.getMilestoneSuggestions(data);
      set({ milestoneSuggestions: result, milestoneSuggestionsLoading: false });
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get milestone suggestions';
      set({ milestoneSuggestionsError: errorMessage, milestoneSuggestionsLoading: false });
      throw error;
    }
  },
  
  clearMilestoneSuggestions: () => set({ milestoneSuggestions: null, milestoneSuggestionsError: null }),

  // Actions for deliverable verification
  verifyDeliverable: async (data) => {
    set({ deliverableVerificationLoading: true, deliverableVerificationError: null });
    try {
      const result = await aiService.verifyDeliverable(data);
      set({ deliverableVerification: result, deliverableVerificationLoading: false });
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to verify deliverable';
      set({ deliverableVerificationError: errorMessage, deliverableVerificationLoading: false });
      throw error;
    }
  },
  
  clearDeliverableVerification: () => set({ deliverableVerification: null, deliverableVerificationError: null }),

  // Actions for dispute analysis
  analyzeDispute: async (data) => {
    set({ disputeAnalysisLoading: true, disputeAnalysisError: null });
    try {
      const result = await aiService.analyzeDispute(data);
      set({ disputeAnalysis: result, disputeAnalysisLoading: false });
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to analyze dispute';
      set({ disputeAnalysisError: errorMessage, disputeAnalysisLoading: false });
      throw error;
    }
  },
  
  clearDisputeAnalysis: () => set({ disputeAnalysis: null, disputeAnalysisError: null }),

  // General actions
  clearError: () => set({ error: null }),
}));