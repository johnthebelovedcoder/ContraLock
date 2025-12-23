export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderRole: 'client' | 'freelancer';
  content: string;
  type: 'TEXT' | 'FILE' | 'NOTIFICATION';
  status: 'SENT' | 'DELIVERED' | 'READ';
  isSystemMessage?: boolean;
  parentId?: string; // For replies
  attachments?: MessageAttachment[];
  readBy: string[]; // Array of user IDs who read the message
  sentAt: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  thumbnailUrl?: string;
  isPreviewable: boolean;
  uploadedAt: Date;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  projectId: string;
  participants: string[]; // User IDs
  unreadCount: number;
  lastMessageId?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dispute {
  id: string;
  projectId: string;
  milestoneId: string;
  clientId: string;
  freelancerId: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_REVIEW' | 'MEDIATION' | 'ARBITRATION' | 'RESOLVED' | 'ESCALATED';
  phase: 'AUTOMATED_REVIEW' | 'MEDIATION' | 'ARBITRATION';
  disputeFee: number;
  resolution?: DisputeResolution;
  resolutionNotes?: string;
  initiatedBy: 'client' | 'freelancer';
  initiatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string; // arbitrator ID
  evidenceSubmitted: DisputeEvidence[];
  communicationLog: DisputeCommunication[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DisputeEvidence {
  id: string;
  disputeId: string;
  submittedBy: string; // user ID
  submittedAt: Date;
  evidenceType: 'FILE' | 'LINK' | 'MESSAGE' | 'DELIVERABLE' | 'COMMUNICATION_LOG';
  description: string;
  fileUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface DisputeCommunication {
  id: string;
  disputeId: string;
  senderId: string;
  senderRole: 'client' | 'freelancer' | 'mediator' | 'arbitrator';
  content: string;
  type: 'MESSAGE' | 'DECISION' | 'NOTIFICATION';
  readBy: string[];
  sentAt: Date;
  createdAt: Date;
}

export interface DisputeResolution {
  id: string;
  disputeId: string;
  resolvedBy: string; // arbitrator ID
  resolverRole: 'mediator' | 'arbitrator';
  decision: 'CLIENT_FAVOR' | 'FREELANCER_FAVOR' | 'PARTIAL_SPLIT' | 'REVISION_REQUIRED' | 'CASE_CLOSED';
  clientAmount: number;
  freelancerAmount: number;
  decisionNotes: string;
  rationale: string;
  decisionDate: Date;
  createdAt: Date;
}