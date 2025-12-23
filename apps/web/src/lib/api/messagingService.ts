import { Message, Conversation, Dispute, DisputeResolution } from '@/types';
import { apiClient } from './client';
import { mockDisputeService } from '../lib/mock-dispute-service';
import { isMockMode } from '@/config/app-config';

export interface SendMessageData {
  projectId: string;
  content: string;
  attachments?: File[];
  type?: 'TEXT' | 'FILE';
}

class MessagingService {
  // Track the last time getConversations was called to prevent rapid calls
  private lastGetConversationsCall = new Map<string, number>();
  private currentGetConversationsPromises = new Map<string, Promise<Conversation[]>>();

  async getConversations(userId: string): Promise<Conversation[]> {
    // Prevent fetching conversations more than once every 5 seconds per user
    const now = Date.now();
    const lastCall = this.lastGetConversationsCall.get(userId) || 0;

    if (now - lastCall < 5000 && this.currentGetConversationsPromises.has(userId)) {
      // Return the existing promise if we're still waiting for the previous one
      return this.currentGetConversationsPromises.get(userId)!;
    }

    this.lastGetConversationsCall.set(userId, now);

    // Make a new request with retry logic
    const promise = this.makeGetConversationsRequestWithBackoff(userId, 3); // Try up to 3 times with backoff
    this.currentGetConversationsPromises.set(userId, promise);

    // Clean up the promise reference after completion
    promise.finally(() => {
      this.currentGetConversationsPromises.delete(userId);
    });

    return promise;
  }

  private async makeGetConversationsRequestWithBackoff(userId: string, maxRetries: number): Promise<Conversation[]> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await apiClient.get(`/messaging/conversations/${userId}`);
        return response.data;
      } catch (error: any) {
        lastError = error;

        // Check if it's a rate limit error
        if (error.response?.status === 429 && attempt < maxRetries - 1) {
          // Calculate backoff time (exponential backoff: 1s, 2s, 4s, etc.)
          const backoffTime = Math.pow(2, attempt) * 1000;
          console.warn(`Rate limited on getConversations, waiting ${backoffTime}ms before retry ${attempt + 1}/${maxRetries}`);

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
    throw lastError;
  }

  async getMessages(projectId?: string, page: number = 1, limit: number = 50): Promise<Message[]> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    let url = '/messaging/messages';
    if (projectId) {
      url = `/messaging/messages/${projectId}`;
    }

    const response = await apiClient.get(`${url}?${params.toString()}`);
    return response.data;
  }

  async sendMessage(messageData: SendMessageData): Promise<Message> {
    // For text-only messages, we can use a regular JSON request which is more efficient for real-time
    if (!messageData.attachments || messageData.attachments.length === 0) {
      const response = await apiClient.post('/messaging/send', {
        projectId: messageData.projectId,
        content: messageData.content,
        type: messageData.type || 'TEXT'
      });

      return response.data;
    }

    // For messages with attachments, use multipart form data
    const formData = new FormData();
    formData.append('projectId', messageData.projectId);
    formData.append('content', messageData.content);
    formData.append('type', messageData.type || 'TEXT');

    messageData.attachments?.forEach((file, index) => {
      formData.append(`attachments[${index}]`, file);
    });

    const response = await apiClient.post('/messaging/send', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await apiClient.post(`/messaging/messages/${messageId}/read`);
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    await apiClient.post(`/messaging/conversations/${conversationId}/read`);
  }

  async uploadFile(file: File): Promise<{ fileUrl: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/messaging/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  // Dispute-related methods
  async createDispute(
    milestoneId: string,
    disputeData: {
      title: string;
      description: string;
      evidence?: File[];
    }
  ): Promise<Dispute> {
    if (isMockMode) {
      return await mockDisputeService.createDispute({
        ...disputeData,
        milestone: milestoneId
      });
    }

    const formData = new FormData();
    formData.append('title', disputeData.title);
    formData.append('description', disputeData.description);

    disputeData.evidence?.forEach((file, index) => {
      formData.append(`evidence[${index}]`, file);
    });

    const response = await apiClient.post(`/disputes`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async getDisputeById(disputeId: string): Promise<Dispute> {
    if (isMockMode) {
      const dispute = await mockDisputeService.getDisputeById(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }
      return dispute;
    }

    const response = await apiClient.get(`/disputes/${disputeId}`);
    return response.data;
  }

  async getDisputes(
    userId: string,
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<Dispute[]> {
    if (isMockMode) {
      return await mockDisputeService.getUserDisputes(userId, status);
    }

    const params = new URLSearchParams({
      userId,
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) {
      params.append('status', status);
    }

    const response = await apiClient.get(`/disputes?${params.toString()}`);
    // Handle both paginated response (with items) and direct array response
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && response.data.items) {
      return response.data.items;
    } else {
      return [];
    }
  }

  async getDisputeResolution(disputeId: string): Promise<DisputeResolution> {
    if (isMockMode) {
      const dispute = await mockDisputeService.getDisputeById(disputeId);
      if (!dispute || !dispute.resolution) {
        throw new Error('Dispute resolution not found');
      }
      return dispute.resolution as DisputeResolution;
    }

    const response = await apiClient.get(`/disputes/${disputeId}/resolution`);
    return response.data;
  }

  async submitDisputeEvidence(
    disputeId: string,
    evidence: {
      description: string;
      files: File[];
    }
  ): Promise<void> {
    if (isMockMode) {
      await mockDisputeService.submitEvidence(disputeId, evidence);
      return;
    }

    const formData = new FormData();
    formData.append('description', evidence.description);

    evidence.files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    await apiClient.post(`/disputes/${disputeId}/evidence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getDisputeMessages(
    disputeId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<Message[]> {
    if (isMockMode) {
      const dispute = await mockDisputeService.getDisputeById(disputeId);
      if (!dispute || !dispute.messages) {
        return [];
      }
      // Convert dispute messages to Message format
      return dispute.messages.map((msg, index) => ({
        id: `msg-${index}`,
        projectId: dispute.project as string,
        senderId: typeof msg.sender === 'string' ? msg.sender : (msg.sender as any).id || 'unknown',
        senderRole: 'client', // Default role, would need more logic in real implementation
        content: msg.content,
        type: 'TEXT',
        status: 'READ',
        sentAt: new Date(msg.sentAt),
        createdAt: new Date(msg.sentAt),
        updatedAt: new Date(msg.sentAt)
      }));
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await apiClient.get(`/disputes/${disputeId}/messages?${params.toString()}`);
    return response.data;
  }

  async sendMessageToDispute(
    disputeId: string,
    messageData: {
      content: string;
      attachments?: File[];
    }
  ): Promise<Message> {
    if (isMockMode) {
      // In mock mode, we'll add the message to the dispute
      const dispute = await mockDisputeService.getDisputeById(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      // Return a mock message
      return {
        id: `msg-${Date.now()}`,
        projectId: dispute.project as string,
        senderId: 'current-user', // Would be actual user ID in real implementation
        senderRole: 'client', // Would be determined in real implementation
        content: messageData.content,
        type: 'TEXT',
        status: 'READ',
        sentAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    const formData = new FormData();
    formData.append('content', messageData.content);

    messageData.attachments?.forEach((file, index) => {
      formData.append(`attachments[${index}]`, file);
    });

    const response = await apiClient.post(`/disputes/${disputeId}/messages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // New enhanced dispute methods
  async triggerDisputeAIReview(disputeId: string): Promise<any> {
    if (isMockMode) {
      // In mock mode, we'll simulate an AI review by updating the dispute with AI analysis
      const dispute = await mockDisputeService.getDisputeById(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      // Return a mock AI analysis
      return {
        confidenceScore: 0.85,
        keyIssues: ['Issue 1', 'Issue 2'],
        recommendedResolution: 'RECOMMENDATION',
        reasoning: 'Mock AI analysis completed',
        disputeId
      };
    }

    const response = await apiClient.post(`/disputes/${disputeId}/review-automated`);
    return response.data;
  }

  async evaluateDisputeEscalation(disputeId: string): Promise<any> {
    if (isMockMode) {
      // In mock mode, return a mock escalation evaluation
      return {
        shouldEscalate: Math.random() > 0.5, // Random decision for mock
        reason: 'Mock escalation evaluation',
        disputeId
      };
    }

    const response = await apiClient.post(`/disputes/${disputeId}/evaluate-escalation`);
    return response.data;
  }

  async getDisputeReport(disputeId: string): Promise<any> {
    if (isMockMode) {
      // In mock mode, return a mock dispute report
      return {
        disputeId,
        summary: 'Mock dispute report',
        timeline: 'Mock timeline',
        evidenceSummary: 'Mock evidence summary',
        recommendations: 'Mock recommendations'
      };
    }

    const response = await apiClient.get(`/disputes/${disputeId}/report`);
    return response.data;
  }

  // Process dispute fee payment
  async processDisputeFee(disputeId: string, paymentMethodId?: string): Promise<any> {
    if (isMockMode) {
      return await mockDisputeService.payDisputeFee(disputeId);
    }

    const response = await apiClient.post(`/disputes/${disputeId}/fee-payment`, {
      paymentMethodId: paymentMethodId
    });
    return response.data;
  }

  // Submit dispute appeal
  async submitDisputeAppeal(
    disputeId: string,
    appealData: {
      reason: string;
      evidence?: File[];
    }
  ): Promise<Dispute> {
    if (isMockMode) {
      return await mockDisputeService.submitAppeal(disputeId, appealData);
    }

    const formData = new FormData();
    formData.append('reason', appealData.reason);

    appealData.evidence?.forEach((file, index) => {
      formData.append(`evidence[${index}]`, file);
    });

    const response = await apiClient.post(`/disputes/${disputeId}/appeal`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Review dispute appeal (admin/arbitrator only)
  async reviewDisputeAppeal(
    disputeId: string,
    reviewData: {
      decision: 'APPROVED' | 'REJECTED';
      decisionReason: string;
    }
  ): Promise<Dispute> {
    if (isMockMode) {
      // In mock mode, we'll update the dispute status based on the review
      const dispute = await mockDisputeService.getDisputeById(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      return {
        ...dispute,
        status: reviewData.decision === 'APPROVED' ? 'PENDING_REVIEW' : 'RESOLVED',
        resolution: {
          decision: reviewData.decision,
          amountToFreelancer: 0,
          amountToClient: 0,
          decisionReason: reviewData.decisionReason,
          decidedBy: 'mock-admin',
          decidedAt: new Date().toISOString(),
          aiRecommended: false
        }
      } as Dispute;
    }

    const response = await apiClient.post(`/disputes/${disputeId}/appeal/review`, reviewData);
    return response.data;
  }
}

export const messagingService = new MessagingService();