import { Project, Milestone } from '@/types';

interface CancellationRequest {
  id: string;
  projectId: string;
  clientId: string;
  freelancerId: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requestedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string; // ID of user who resolved (client or freelancer)
}

export class ProjectCancellationService {
  private static instance: ProjectCancellationService;
  private cancellationRequests: CancellationRequest[] = [];

  private constructor() {}

  public static getInstance(): ProjectCancellationService {
    if (!ProjectCancellationService.instance) {
      ProjectCancellationService.instance = new ProjectCancellationService();
    }
    return ProjectCancellationService.instance;
  }

  /**
   * Request to cancel a project
   * This creates a cancellation request that needs freelancer consent
   */
  async requestProjectCancellation(
    projectId: string,
    clientId: string,
    freelancerId: string,
    reason: string
  ): Promise<CancellationRequest> {
    // Check if there's already a pending cancellation request for this project
    const existingRequest = this.cancellationRequests.find(
      req => req.projectId === projectId && req.status === 'PENDING'
    );

    if (existingRequest) {
      throw new Error('A cancellation request already exists for this project');
    }

    const cancellationRequest: CancellationRequest = {
      id: `cancel-${Date.now()}`,
      projectId,
      clientId,
      freelancerId,
      reason,
      status: 'PENDING',
      requestedAt: new Date(),
    };

    this.cancellationRequests.push(cancellationRequest);

    // In a real app, this would trigger notifications to the freelancer
    this.notifyFreelancerOfCancellationRequest(cancellationRequest);

    return cancellationRequest;
  }

  /**
   * Approve a cancellation request (freelancer同意)
   */
  async approveCancellation(cancellationId: string, approvedBy: string): Promise<CancellationRequest> {
    const request = this.cancellationRequests.find(req => req.id === cancellationId);
    
    if (!request) {
      throw new Error('Cancellation request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Cancellation request is not pending');
    }

    // Verify that the approver is the freelancer
    if (approvedBy !== request.freelancerId) {
      throw new Error('Only the freelancer can approve project cancellation');
    }

    request.status = 'APPROVED';
    request.resolvedAt = new Date();
    request.resolvedBy = approvedBy;

    // Process the refund after approval
    await this.processRefund(request.projectId);

    return request;
  }

  /**
   * Reject a cancellation request (freelancer不同意)
   */
  async rejectCancellation(cancellationId: string, rejectedBy: string, reason?: string): Promise<CancellationRequest> {
    const request = this.cancellationRequests.find(req => req.id === cancellationId);
    
    if (!request) {
      throw new Error('Cancellation request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Cancellation request is not pending');
    }

    // Verify that the rejector is the freelancer
    if (rejectedBy !== request.freelancerId) {
      throw new Error('Only the freelancer can reject project cancellation');
    }

    request.status = 'REJECTED';
    request.resolvedAt = new Date();
    request.resolvedBy = rejectedBy;

    // In a real app, this would send a notification to the client
    this.notifyClientOfCancellationRejection(request, reason);

    return request;
  }

  /**
   * Process refund of unused funds back to client
   */
  private async processRefund(projectId: string): Promise<void> {
    // In a real app, this would:
    // 1. Calculate remaining funds in escrow (not tied to completed milestones)
    // 2. Transfer those funds back to the client's wallet
    // 3. Update project status to CANCELLED
    console.log(`Processing refund for project ${projectId}`);
    
    // For mock implementation, we'll just update project status
    // This would be handled by the wallet service in a real implementation
  }

  /**
   * Notify freelancer about cancellation request
   */
  private notifyFreelancerOfCancellationRequest(request: CancellationRequest): void {
    // In a real app, this would send a notification via the messaging system
    console.log(`Notifying freelancer ${request.freelancerId} about cancellation request for project ${request.projectId}`);
  }

  /**
   * Notify client about cancellation rejection
   */
  private notifyClientOfCancellationRejection(request: CancellationRequest, reason?: string): void {
    // In a real app, this would send a notification via the messaging system
    console.log(`Notifying client ${request.clientId} that cancellation was rejected for project ${request.projectId}`, reason);
  }

  /**
   * Get cancellation requests for a project
   */
  getProjectCancellationRequests(projectId: string): CancellationRequest[] {
    return this.cancellationRequests.filter(req => req.projectId === projectId);
  }

  /**
   * Get pending cancellation requests for a user
   */
  getPendingCancellationRequests(userId: string): CancellationRequest[] {
    return this.cancellationRequests.filter(
      req => (req.freelancerId === userId || req.clientId === userId) && req.status === 'PENDING'
    );
  }

  /**
   * Get cancellation request by ID
   */
  getCancellationRequestById(id: string): CancellationRequest | undefined {
    return this.cancellationRequests.find(req => req.id === id);
  }
}