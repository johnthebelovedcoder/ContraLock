import { EscrowAccount, Transaction, Invoice, Balance, Payout } from '@/types';
import { apiClient } from './client';

export interface DepositFundsData {
  projectId: string;
  amount: number;
  paymentMethodId?: string;
  currency: string;
  paymentMethodType: 'card' | 'crypto' | 'bank' | 'paypal';
  cryptoTxHash?: string;
  cryptoNetwork?: string;
  exchangeRate?: number;
  targetCurrency?: string; // The currency the user wants to deposit in
}

export interface CreatePayoutData {
  userId: string;
  amount: number;
  payoutMethod: 'BANK_TRANSFER' | 'INSTANT_DEPOSIT' | 'PAYPAL';
  paymentMethodId?: string;
}

class PaymentService {
  async getEscrowAccount(projectId: string): Promise<EscrowAccount> {
    const response = await apiClient.get(`/payments/escrow/${projectId}`);
    return response.data;
  }

  async depositFunds(depositData: DepositFundsData): Promise<EscrowAccount> {
    const response = await apiClient.post('/payments/deposit', depositData);
    return response.data.project; // Return the updated project/escrow account
  }

  async getTransactions(
    userId: string,
    filters?: {
      type?: string;
      dateFrom?: Date;
      dateTo?: Date;
      projectId?: string;
    }
  ): Promise<Transaction[]> {
    const params = new URLSearchParams({ userId, ...filters });
    
    const response = await apiClient.get(`/payments/transactions?${params.toString()}`);
    return response.data;
  }

  async getTransactionById(transactionId: string): Promise<Transaction> {
    const response = await apiClient.get(`/payments/transactions/${transactionId}`);
    return response.data;
  }

  async getInvoiceById(invoiceId: string): Promise<Invoice> {
    const response = await apiClient.get(`/payments/invoices/${invoiceId}`);
    return response.data;
  }

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    const response = await apiClient.get(`/payments/invoices/${invoiceId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getUserBalance(userId: string): Promise<Balance> {
    const response = await apiClient.get(`/payments/balance/${userId}`);
    return response.data;
  }

  async getPayouts(userId: string): Promise<Payout[]> {
    const response = await apiClient.get(`/payments/payouts/${userId}`);
    return response.data;
  }

  async createPayout(payoutData: CreatePayoutData): Promise<Payout> {
    const response = await apiClient.post('/payments/payouts', payoutData);
    return response.data;
  }

  async getPayoutById(payoutId: string): Promise<Payout> {
    const response = await apiClient.get(`/payments/payouts/${payoutId}`);
    return response.data;
  }

  async cancelPayout(payoutId: string): Promise<Payout> {
    const response = await apiClient.patch(`/payments/payouts/${payoutId}/cancel`);
    return response.data;
  }

  async estimatePayoutFees(
    userId: string,
    amount: number,
    method: 'BANK_TRANSFER' | 'INSTANT_DEPOSIT' | 'PAYPAL'
  ): Promise<{ fees: number; netAmount: number }> {
    const response = await apiClient.post('/payments/payouts/estimate', {
      userId,
      amount,
      method,
    });
    return response.data;
  }

  async getPaymentMethods(userId: string): Promise<any[]> {
    const response = await apiClient.get(`/payments/methods/${userId}`);
    return response.data;
  }

  async addPaymentMethod(userId: string, paymentMethod: any): Promise<any> {
    const response = await apiClient.post(`/payments/methods/${userId}`, paymentMethod);
    return response.data;
  }

  async removePaymentMethod(userId: string, methodId: string): Promise<void> {
    await apiClient.delete(`/payments/methods/${userId}/${methodId}`);
  }
}

export const paymentService = new PaymentService();