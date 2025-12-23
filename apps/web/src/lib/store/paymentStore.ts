import { create } from 'zustand';
import { EscrowAccount, Transaction, Balance, Payout } from '@/types';
import { paymentService } from '../api';

interface PaymentState {
  escrowAccounts: Record<string, EscrowAccount>; // projectId -> EscrowAccount
  transactions: Transaction[];
  balance: Balance | null;
  payouts: Payout[];
  loading: boolean;
  error: string | null;

  // Escrow actions
  fetchEscrowAccount: (projectId: string) => Promise<void>;
  depositFunds: (depositData: any) => Promise<EscrowAccount>;

  // Transaction actions
  fetchTransactions: (userId: string, filters?: any) => Promise<void>;

  // Balance actions
  fetchBalance: (userId: string) => Promise<void>;

  // Payout actions
  fetchPayouts: (userId: string) => Promise<void>;
  createPayout: (payoutData: any) => Promise<Payout>;

  // Payment methods actions
  addPaymentMethod: (paymentMethodData: any) => Promise<any>;
  getPaymentMethods: (userId: string) => Promise<any[]>;
  removePaymentMethod: (userId: string, methodId: string) => Promise<void>;

  clearError: () => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  escrowAccounts: {},
  transactions: [],
  balance: null,
  payouts: [],
  loading: false,
  error: null,

  fetchEscrowAccount: async (projectId) => {
    set({ loading: true });
    try {
      const escrowAccount = await paymentService.getEscrowAccount(projectId);
      set((state) => ({
        escrowAccounts: { ...state.escrowAccounts, [projectId]: escrowAccount },
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch escrow account', loading: false });
      throw error;
    }
  },

  depositFunds: async (depositData) => {
    set({ loading: true });
    try {
      const updatedEscrowAccount = await paymentService.depositFunds(depositData);
      const { projectId } = depositData;
      set((state) => ({
        escrowAccounts: { ...state.escrowAccounts, [projectId]: updatedEscrowAccount },
        loading: false,
      }));
      return updatedEscrowAccount;
    } catch (error: any) {
      set({ error: error.message || 'Failed to deposit funds', loading: false });
      throw error;
    }
  },

  fetchTransactions: async (userId, filters = {}) => {
    set({ loading: true });
    try {
      const transactions = await paymentService.getTransactions(userId, filters);
      set({ transactions, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch transactions', loading: false });
      throw error;
    }
  },

  fetchBalance: async (userId) => {
    set({ loading: true });
    try {
      const balance = await paymentService.getUserBalance(userId);
      set({ balance, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch balance', loading: false });
      throw error;
    }
  },

  fetchPayouts: async (userId) => {
    try {
      const payouts = await paymentService.getPayouts(userId);
      set({ payouts });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch payouts' });
      throw error;
    }
  },

  createPayout: async (payoutData) => {
    try {
      const payout = await paymentService.createPayout(payoutData);
      set((state) => ({
        payouts: [...state.payouts, payout],
      }));
      return payout;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create payout' });
      throw error;
    }
  },

  addPaymentMethod: async (paymentMethodData) => {
    set({ loading: true });
    try {
      // Prepare the payment method data for the API
      const apiPayload = { ...paymentMethodData };

      // Remove userId from the payload as it's part of the URL
      const { userId, ...paymentMethodDetails } = apiPayload;

      const result = await paymentService.addPaymentMethod(userId, paymentMethodDetails);
      set({ loading: false });
      return result;
    } catch (error: any) {
      set({ error: error.message || 'Failed to add payment method', loading: false });
      throw error;
    }
  },

  getPaymentMethods: async (userId) => {
    try {
      const methods = await paymentService.getPaymentMethods(userId);
      return methods;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch payment methods' });
      throw error;
    }
  },

  removePaymentMethod: async (userId, methodId) => {
    try {
      await paymentService.removePaymentMethod(userId, methodId);
      // Optionally update state to remove the method from the UI
    } catch (error: any) {
      set({ error: error.message || 'Failed to remove payment method' });
      throw error;
    }
  },

  // Add demo data initialization function if needed
  initializeDemoData: () => {
    // This function is no longer needed as we're using real API data
    // No-op implementation to maintain existing interface if called
  },

  clearError: () => set({ error: null }),
}));