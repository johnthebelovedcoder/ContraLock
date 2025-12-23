export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  totalBudget: number;
  totalBudgetInUsd?: number; // Amount converted to USD for standardization
  timeline: string;
  deadline: Date;
  status: 'DRAFT' | 'PENDING_ACCEPTANCE' | 'AWAITING_DEPOSIT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  clientId: string;
  freelancerId?: string;
  escrowAmount?: number;
  escrowAmountInUsd?: number; // Amount converted to USD for standardization
  escrowStatus?: 'NOT_DEPOSITED' | 'HELD' | 'PARTIALLY_RELEASED' | 'RELEASED' | 'REFUNDED';
  platformFee: number;
  platformFeeInUsd?: number; // Amount converted to USD for standardization
  paymentProcessingFee: number;
  paymentProcessingFeeInUsd?: number; // Amount converted to USD for standardization
  currency: string; // Currency of the project
  exchangeRate?: number; // Exchange rate used for conversion to USD
  exchangeRateTimestamp?: Date; // When the exchange rate was applied
  inviteToken?: string;
  sharingEnabled?: boolean;
  autoApprovalPeriod: number; // in days
  maxRevisionsPerMilestone: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  amount: number;
  currency?: string; // Currency of the milestone amount
  deadline: Date;
  acceptanceCriteria: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVISION_REQUESTED' | 'APPROVED' | 'DISPUTED';
  order: number;
  deliverables?: Deliverable[];
  submissionNotes?: string;
  approvalNotes?: string;
  revisionNotes?: string;
  approvedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deliverable {
  id: string;
  milestoneId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  isPreviewable: boolean;
  uploadedBy: string;
  uploadedAt: Date;
  createdAt: Date;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  clientEmail: string;
  freelancerEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Extended invitation with project details for display
  projectTitle?: string;
  projectDescription?: string;
  projectCategory?: string;
  projectBudget?: number;
  projectTimeline?: string;
  projectDeadline?: Date;
  escrowStatus?: 'NOT_DEPOSITED' | 'HELD' | 'PARTIALLY_RELEASED' | 'RELEASED' | 'REFUNDED';
  milestones?: Milestone[];
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  userId: string;
  actorRole: 'client' | 'freelancer';
  action:
    | 'PROJECT_CREATED'
    | 'PROJECT_INVITED'
    | 'PROJECT_ACCEPTED'
    | 'PROJECT_DECLINED'
    | 'FUNDS_DEPOSITED'
    | 'MILESTONE_STARTED'
    | 'MILESTONE_SUBMITTED'
    | 'MILESTONE_APPROVED'
    | 'MILESTONE_REVISION_REQUESTED'
    | 'MILESTONE_DISPUTED'
    | 'PAYMENT_RELEASED'
    | 'MESSAGE_SENT'
    | 'DISPUTE_RAISED'
    | 'DISPUTE_RESOLVED'
    | 'PROJECT_COMPLETED'
    | 'PROJECT_CANCELLED';
  details: Record<string, any>;
  createdAt: Date;
}

export interface ChangeProposal {
  id: string;
  projectId: string;
  milestoneId: string;
  proposer: 'client' | 'freelancer';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  originalValues: {
    title?: string;
    description?: string;
    deadline?: Date;
    amount?: number;
  };
  proposedValues: {
    title?: string;
    description?: string;
    deadline?: Date;
    amount?: number;
  };
  reason: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string; // userId of who resolved the proposal
  resolutionNotes?: string;
}