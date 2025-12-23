export interface EscrowAccount {
  id: string;
  projectId: string;
  clientId: string;
  freelancerId: string;
  totalAmount: number;
  totalAmountInUsd?: number; // Amount converted to USD for standardization
  heldAmount: number;
  releasedAmount: number;
  currency: string; // The primary currency of the escrow account
  status: 'NOT_DEPOSITED' | 'HELD' | 'PARTIALLY_RELEASED' | 'RELEASED' | 'REFUNDED';
  platformFee: number;
  paymentProcessingFee: number;
  exchangeRate?: number; // Exchange rate used for conversion to USD
  exchangeRateTimestamp?: Date; // When the exchange rate was applied
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  projectId: string;
  milestoneId?: string;
  fromUserId: string;
  toUserId: string;
  type: 'DEPOSIT' | 'RELEASE' | 'WITHDRAWAL' | 'REFUND' | 'FEE' | 'DISPUTE_SETTLEMENT';
  amount: number;
  currency: string; // The currency of the transaction
  amountInUsd?: number; // Amount converted to USD for standardization
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethodId?: string;
  paymentMethodType: 'card' | 'crypto' | 'bank' | 'paypal'; // Added payment method type
  stripeIntentId?: string;
  stripeTransferId?: string;
  stripeRefundId?: string;
  cryptoTxHash?: string; // For crypto transactions
  cryptoNetwork?: string; // The blockchain network used
  exchangeRate?: number; // Exchange rate used for conversion to USD
  exchangeRateTimestamp?: Date; // When the exchange rate was applied
  description?: string;
  referenceId?: string; // Reference to related entities
  processedAt?: Date;
  fees?: {
    platform: number;
    paymentProcessor: number;
    total: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

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

export interface Balance {
  id: string;
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  currency: string;
  availableBalanceInUsd?: number; // Available balance converted to USD
  pendingBalanceInUsd?: number; // Pending balance converted to USD
  totalBalanceInUsd?: number; // Total balance converted to USD
  exchangeRate?: number; // Exchange rate used for conversion to USD
  exchangeRateTimestamp?: Date; // When the exchange rate was applied
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payout {
  id: string;
  userId: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  payoutMethod: 'BANK_TRANSFER' | 'INSTANT_DEPOSIT' | 'PAYPAL';
  paymentMethodId?: string;
  stripePayoutId?: string;
  fees: number;
  netAmount: number;
  requestedAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}