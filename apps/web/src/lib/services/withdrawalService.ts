export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number; // in cents
  currency: string;
  paymentMethodId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  requestedAt: Date;
  processedAt?: Date;
  transactionId?: string;
  failureReason?: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'BANK_ACCOUNT' | 'CARD' | 'CRYPTO';
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpiry?: string;
  walletAddress?: string;
  currency?: string;
  isDefault: boolean;
}

export class WithdrawalService {
  private static instance: WithdrawalService;
  private withdrawalRequests: WithdrawalRequest[] = [];
  private paymentMethods: PaymentMethod[] = [];

  private constructor() {}

  public static getInstance(): WithdrawalService {
    if (!WithdrawalService.instance) {
      WithdrawalService.instance = new WithdrawalService();
    }
    return WithdrawalService.instance;
  }

  /**
   * Request a withdrawal from user's wallet
   */
  async requestWithdrawal(
    userId: string,
    amount: number,
    paymentMethodId: string
  ): Promise<WithdrawalRequest> {
    // Validate the request
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be greater than zero');
    }

    // Check if payment method exists and belongs to user
    const paymentMethod = this.paymentMethods.find(
      pm => pm.id === paymentMethodId && pm.userId === userId
    );

    if (!paymentMethod) {
      throw new Error('Invalid payment method');
    }

    // In a real app, we would check wallet balance here
    // For mock implementation, we'll assume sufficient balance

    const withdrawalRequest: WithdrawalRequest = {
      id: `wd-${Date.now()}`,
      userId,
      amount,
      currency: 'USD',
      paymentMethodId,
      status: 'PENDING',
      requestedAt: new Date(),
    };

    this.withdrawalRequests.push(withdrawalRequest);

    // In a real app, this would trigger the payment processing
    this.processWithdrawal(withdrawalRequest);

    return withdrawalRequest;
  }

  /**
   * Process the withdrawal (simplified for mock implementation)
   */
  private async processWithdrawal(request: WithdrawalRequest): Promise<void> {
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real app, this would:
      // 1. Verify wallet balance
      // 2. Process the payment through a payment processor (Stripe, etc.)
      // 3. Update wallet balance
      // 4. Record the transaction

      request.status = 'COMPLETED';
      request.processedAt = new Date();
      request.transactionId = `txn-${Date.now()}`;

      console.log(`Withdrawal ${request.id} processed successfully for user ${request.userId}`);
    } catch (error) {
      request.status = 'FAILED';
      request.failureReason = (error as Error).message;
      console.error(`Withdrawal ${request.id} failed:`, error);
    }
  }

  /**
   * Get withdrawal requests for a user
   */
  getUserWithdrawalRequests(userId: string): WithdrawalRequest[] {
    return this.withdrawalRequests.filter(req => req.userId === userId);
  }

  /**
   * Get withdrawal request by ID
   */
  getWithdrawalRequestById(id: string): WithdrawalRequest | undefined {
    return this.withdrawalRequests.find(req => req.id === id);
  }

  /**
   * Add a payment method for a user
   */
  async addPaymentMethod(
    userId: string,
    type: 'BANK_ACCOUNT' | 'CARD' | 'CRYPTO',
    details: {
      bankName?: string;
      accountNumber?: string;
      routingNumber?: string;
      cardBrand?: string;
      cardLast4?: string;
      cardExpiry?: string;
      walletAddress?: string;
      currency?: string;
    }
  ): Promise<PaymentMethod> {
    const paymentMethod: PaymentMethod = {
      id: `pm-${Date.now()}`,
      userId,
      type,
      bankName: details.bankName,
      accountNumber: details.accountNumber,
      routingNumber: details.routingNumber,
      cardBrand: details.cardBrand,
      cardLast4: details.cardLast4,
      cardExpiry: details.cardExpiry,
      walletAddress: details.walletAddress,
      currency: details.currency,
      isDefault: this.paymentMethods.filter(pm => pm.userId === userId).length === 0, // First method is default
    };

    this.paymentMethods.push(paymentMethod);

    return paymentMethod;
  }

  /**
   * Get payment methods for a user
   */
  getUserPaymentMethods(userId: string): PaymentMethod[] {
    return this.paymentMethods.filter(pm => pm.userId === userId);
  }

  /**
   * Set a payment method as default
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const userMethods = this.paymentMethods.filter(pm => pm.userId === userId);
    
    if (!userMethods.some(pm => pm.id === paymentMethodId)) {
      throw new Error('Payment method does not belong to user');
    }

    // Set all user methods to non-default
    userMethods.forEach(pm => {
      pm.isDefault = pm.id === paymentMethodId;
    });
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    const index = this.paymentMethods.findIndex(pm => pm.id === paymentMethodId);
    if (index !== -1) {
      // If it's the default method, set another as default
      const methodToRemove = this.paymentMethods[index];
      if (methodToRemove.isDefault) {
        const otherUserMethods = this.paymentMethods.filter(
          pm => pm.userId === methodToRemove.userId && pm.id !== paymentMethodId
        );
        if (otherUserMethods.length > 0) {
          otherUserMethods[0].isDefault = true;
        }
      }

      this.paymentMethods.splice(index, 1);
    }
  }
}