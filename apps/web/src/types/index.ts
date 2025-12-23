export interface UserPaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'crypto' | 'bank';
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  bankName?: string;
  cryptoType?: 'bitcoin' | 'ethereum' | 'litecoin' | 'usdc' | 'usdt';
  address?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'freelancer' | 'admin';
  status: string;
  profile: {
    bio?: string;
    location?: string;
    skills?: string[];
    portfolioLinks?: { url: string; description?: string }[];
    completed?: boolean;
    avatar?: string;
  };
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  preferredCurrency?: string;
  paymentMethods?: UserPaymentMethod[];
  statistics?: {
    totalEarned?: number;
  };
}

export interface PaymentMethod {
  type: 'card' | 'crypto' | 'bank' | 'paypal';
  providerId: string;
  last4?: string; // For cards
  default: boolean;
  walletAddress?: string; // For crypto
  currency?: string; // For crypto
  email?: string; // For PayPal
  bankName?: string; // For bank accounts
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget: number; // in cents
  deadline: string;
  status: string;
  client: User | string;
  freelancer: User | string;
  milestones: Milestone[];
  progress: {
    completed: number;
    total: number;
  };
  escrow: {
    status: string;
    totalHeld: number;
    totalReleased: number;
    remaining: number;
  };
  paymentSchedule: {
    autoApproveDays: number;
    platformFeePercent: number;
  };
  activityLog: any[];
  createdAt: string;
  updatedAt: string;
  files?: ProjectFile[];
}

export interface Milestone {
  _id: string;
  title: string;
  description: string;
  amount: number; // in cents
  deadline: string;
  acceptanceCriteria: string;
  status: string;
  submittedAt?: string;
  approvedAt?: string;
  startedAt?: string;
  revisionHistory?: any[];
  deliverables?: Deliverable[];
  submissionNotes?: string;
  revisionNotes?: string;
  createdAt: string;
  updatedAt: string;
  project?: string;
}

export interface Deliverable {
  filename: string;
  url?: string;
  path?: string;
  type?: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface Transaction {
  _id: string;
  projectId: string;
  milestoneId?: string;
  disputeId?: string;
  type: 'DEPOSIT' | 'MILESTONE_RELEASE' | 'DISPUTE_PAYMENT' | 'DISPUTE_REFUND' | 'ADMIN_ADJUSTMENT' | 'REFUND' | 'WITHDRAWAL' | 'FEE';
  amount: number; // in cents
  currency: string;
  amountInUsd?: number;
  from?: string; // user ID
  to?: string; // user ID
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  provider: string;
  paymentMethodId?: string;
  paymentMethodType?: 'card' | 'crypto' | 'bank' | 'paypal';
  providerTransactionId?: string;
  stripeIntentId?: string;
  stripeTransferId?: string;
  stripeRefundId?: string;
  cryptoTxHash?: string;
  cryptoNetwork?: string;
  exchangeRate?: number;
  exchangeRateTimestamp?: Date;
  description?: string;
  referenceId?: string;
  fees?: {
    platform: number;
    paymentProcessor: number;
    total: number;
  };
  processedAt?: string;
  failureReason?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Dispute {
  _id: string;
  project: Project | string;
  milestone: Milestone | string;
  raisedBy: User | string;
  reason: string;
  evidence?: {
    filename?: string;
    url?: string;
    type?: string;
    uploadedBy?: string;
  }[];
  status: string;
  resolutionPhase?: string;
  aiAnalysis?: any;
  mediator?: User | string;
  arbitrator?: User | string;
  resolution?: {
    decision: string;
    amountToFreelancer: number;
    amountToClient: number;
    decisionReason: string;
    decidedBy: string;
    decidedAt: string;
    aiRecommended?: boolean;
  };
  messages?: {
    sender: User | string;
    content: string;
    sentAt: string;
  }[];
  disputeFeePaid?: any;
  createdAt: string;
  updatedAt: string;
}

// Helper type to extract the actual object if it's stored as an object
export type DisputeWithProjectObject = Omit<Dispute, 'project'> & { project: Project };
export type DisputeWithMilestoneObject = Omit<Dispute, 'milestone'> & { milestone: Milestone };

export interface Invoice {
  id: string;
  projectId: string;
  milestoneId: string;
  clientId: string;
  freelancerId: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE';
  dueDate: Date;
  issuedDate: Date;
  invoiceNumber: string;
  paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CRYPTO' | 'PAYPAL';
  pdfUrl: string;
  currency: string;
  exchangeRate?: number;
  client: {
    name: string;
    email: string;
    address?: string;
  };
  freelancer: {
    name: string;
    email: string;
    taxId?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  purpose: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ChangeProposal {
  id: string;
  projectId: string;
  milestoneId: string;
  proposer: 'client' | 'freelancer';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  originalValues: any;
  proposedValues: any;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolver?: string; // User ID who resolved it
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  clientEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
  token: string;
  acceptedAt?: string;
  declinedAt?: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  readAt?: string;
  relatedEntity?: string;
  relatedEntityId?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  sentVia: string[];
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
}