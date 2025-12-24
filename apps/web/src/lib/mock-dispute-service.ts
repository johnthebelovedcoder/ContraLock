import { Dispute } from '@/types';
import { getMockDisputes } from './mock-data';

// Mock dispute service for the dispute page
export class MockDisputeService {
  // Get all disputes for a user
  async getUserDisputes(userId: string, status?: string): Promise<Dispute[]> {
    // In a real app, this would make an API call
    // For now, return mock data filtered by user and status if provided
    let disputes = getMockDisputes();
    
    // Filter by user (raisedBy)
    disputes = disputes.filter(dispute => 
      typeof dispute.raisedBy === 'string' 
        ? dispute.raisedBy === userId 
        : (dispute.raisedBy as any).id === userId
    );
    
    // Filter by status if provided
    if (status && status !== 'all') {
      disputes = disputes.filter(dispute => dispute.status === status);
    }
    
    return disputes;
  }

  // Get a single dispute by ID
  async getDisputeById(disputeId: string): Promise<Dispute | null> {
    // In a real app, this would make an API call
    const disputes = getMockDisputes();
    const dispute = disputes.find(d => d._id === disputeId);
    return dispute || null;
  }

  // Create a new dispute
  async createDispute(disputeData: Partial<Dispute>): Promise<Dispute> {
    // In a real app, this would make an API call
    // For now, create a new dispute with mock data
    const newDispute: Dispute = {
      _id: `disp-${Date.now()}`,
      project: disputeData.project || 'proj-unknown',
      milestone: disputeData.milestone || 'ms-unknown',
      raisedBy: disputeData.raisedBy || 'user-unknown',
      reason: disputeData.reason || 'New dispute reason',
      evidence: disputeData.evidence || [],
      status: 'PENDING_FEE',
      resolutionPhase: 'INITIAL',
      aiAnalysis: null,
      mediator: null,
      arbitrator: null,
      resolution: null,
      messages: [
        {
          sender: disputeData.raisedBy || 'user-unknown',
          content: `Dispute created: ${disputeData.reason || 'New dispute'}`,
          sentAt: new Date().toISOString()
        }
      ],
      disputeFeePaid: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newDispute;
  }

  // Submit evidence for a dispute
  async submitEvidence(disputeId: string, evidenceData: any): Promise<Dispute> {
    // In a real app, this would make an API call
    const disputes = getMockDisputes();
    const dispute = disputes.find(d => d._id === disputeId);
    
    if (!dispute) {
      throw new Error(`Dispute with ID ${disputeId} not found`);
    }
    
    // Add evidence to the dispute
    const updatedDispute = {
      ...dispute,
      evidence: [
        ...(dispute.evidence || []),
        ...evidenceData.files.map((file: any) => ({
          filename: file.name,
          url: URL.createObjectURL(file),
          type: file.type,
          uploadedBy: 'current-user' // This would be the actual user ID in real implementation
        }))
      ],
      messages: [
        ...(dispute.messages || []),
        {
          sender: 'current-user', // This would be the actual user ID
          content: `Submitted evidence: ${evidenceData.description || 'New evidence'}`,
          sentAt: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString()
    };
    
    return updatedDispute;
  }

  // Pay dispute fee
  async payDisputeFee(disputeId: string): Promise<Dispute> {
    // In a real app, this would make an API call
    const disputes = getMockDisputes();
    const dispute = disputes.find(d => d._id === disputeId);
    
    if (!dispute) {
      throw new Error(`Dispute with ID ${disputeId} not found`);
    }
    
    // Update dispute status and fee payment status
    const updatedDispute = {
      ...dispute,
      disputeFeePaid: true,
      status: 'PENDING_REVIEW',
      messages: [
        ...(dispute.messages || []),
        {
          sender: 'system',
          content: 'Dispute fee paid successfully. Case moved to review phase.',
          sentAt: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString()
    };
    
    return updatedDispute;
  }

  // Submit appeal for a dispute
  async submitAppeal(disputeId: string, appealData: any): Promise<Dispute> {
    // In a real app, this would make an API call
    const disputes = getMockDisputes();
    const dispute = disputes.find(d => d._id === disputeId);
    
    if (!dispute) {
      throw new Error(`Dispute with ID ${disputeId} not found`);
    }
    
    // Update dispute with appeal information
    const updatedDispute = {
      ...dispute,
      status: 'ESCALATED',
      messages: [
        ...(dispute.messages || []),
        {
          sender: 'current-user', // This would be the actual user ID
          content: `Submitted appeal: ${appealData.reason}`,
          sentAt: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString()
    };
    
    return updatedDispute;
  }

  // Get statistics for disputes
  async getDisputeStats(userId: string): Promise<{
    total: number;
    open: number;
    resolved: number;
    inMediation: number;
    inArbitration: number;
  }> {
    const disputes = await this.getUserDisputes(userId);
    
    return {
      total: disputes.length,
      open: disputes.filter(d => 
        d.status !== 'RESOLVED' && 
        d.status !== 'AWAITING_OUTCOME' && 
        d.status !== 'PENDING_FEE'
      ).length,
      resolved: disputes.filter(d => d.status === 'RESOLVED').length,
      inMediation: disputes.filter(d => d.status === 'IN_MEDIATION').length,
      inArbitration: disputes.filter(d => d.status === 'IN_ARBITRATION').length
    };
  }
}

// Export a singleton instance
export const mockDisputeService = new MockDisputeService();