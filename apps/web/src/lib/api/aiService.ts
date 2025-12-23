import { apiClient } from './client';

interface MilestoneSuggestionRequest {
  projectDescription: string;
  budget: number;
  category?: string;
}

interface MilestoneSuggestionResponse {
  suggestedMilestones: {
    title: string;
    description: string;
    amount: number;
    deadlineDays: number;
  }[];
  confidenceScore: number;
  recommendations: string[];
}

interface DeliverableVerificationRequest {
  milestoneDescription: string;
  acceptanceCriteria: string;
  submittedDeliverable: string;
}

interface DeliverableVerificationResponse {
  confidenceScore: number;
  feedback: string[];
  recommendation: 'approve' | 'request_revision' | 'dispute';
  specificFeedback: string[];
}

interface DisputeAnalysisRequest {
  projectAgreement: string;
  disputeDescription: string;
  evidence?: any[];
}

interface DisputeAnalysisResponse {
  confidenceLevel: number;
  keyIssues: string[];
  recommendedResolution: {
    decision: 'full_payment' | 'partial_payment' | 'refund' | 'revision_needed';
    amountToFreelancer: number;
    amountToClient: number;
  };
  reasoning: string;
  suggestions: string[];
}

class AIService {
  // Get AI-powered milestone suggestions based on project description
  async getMilestoneSuggestions(data: MilestoneSuggestionRequest): Promise<MilestoneSuggestionResponse> {
    const response = await apiClient.post('/ai/milestone-suggestions', data);
    return response.data;
  }

  // Verify if a submitted deliverable meets acceptance criteria
  async verifyDeliverable(data: DeliverableVerificationRequest): Promise<DeliverableVerificationResponse> {
    const response = await apiClient.post('/ai/verify-deliverable', data);
    return response.data;
  }

  // Analyze disputes and provide recommendations
  async analyzeDispute(data: DisputeAnalysisRequest): Promise<DisputeAnalysisResponse> {
    const response = await apiClient.post('/ai/dispute-analysis', data);
    return response.data;
  }

  // Additional AI services that could be implemented
  async getPricingAdvice(data: { projectDescription: string; category: string; marketData?: any }): Promise<any> {
    const response = await apiClient.post('/ai/pricing-advice', data);
    return response.data;
  }

  async auditContract(data: { contractText: string; projectDetails?: any }): Promise<any> {
    const response = await apiClient.post('/ai/contract-audit', data);
    return response.data;
  }

  async summarizeCommunication(data: { conversation: string; context?: any }): Promise<any> {
    const response = await apiClient.post('/ai/communication-summary', data);
    return response.data;
  }
}

export const aiService = new AIService();

export type {
  MilestoneSuggestionRequest,
  MilestoneSuggestionResponse,
  DeliverableVerificationRequest,
  DeliverableVerificationResponse,
  DisputeAnalysisRequest,
  DisputeAnalysisResponse
};