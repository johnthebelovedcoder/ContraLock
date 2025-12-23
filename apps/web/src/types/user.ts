export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'freelancer' | 'admin' | 'arbitrator';
  status: 'unverified' | 'verified' | 'pending' | 'suspended';
  profilePicture?: string;
  bio?: string;
  location?: string;
  skills?: string[];
  portfolioLinks?: string[];
  rating?: number;
  completedProjects?: number;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAuth {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'freelancer' | 'admin' | 'arbitrator';
  verified: boolean;
  token: string;
  refreshToken?: string;
}

export interface KYCVerification {
  id: string;
  userId: string;
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  documentType: 'passport' | 'drivers_license' | 'id_card' | 'other';
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl: string;
  addressProofUrl?: string;
  verificationExpiry?: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'bank_account' | 'paypal' | 'crypto';
  isDefault: boolean;
  verified: boolean;
  stripeId?: string;
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  email?: string;
  walletAddress?: string;
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
}