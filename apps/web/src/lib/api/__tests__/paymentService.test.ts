import { paymentService } from '../api/paymentService';
import { apiClient } from '../api/client';

// Mock the API client
jest.mock('../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEscrowAccount', () => {
    it('should fetch escrow account for a project', async () => {
      const mockEscrowAccount = {
        projectId: 'project123',
        totalHeld: 5000,
        totalReleased: 2000,
        remaining: 3000,
        status: 'HELD',
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockEscrowAccount });

      const result = await paymentService.getEscrowAccount('project123');

      expect(apiClient.get).toHaveBeenCalledWith('/payments/escrow/project123');
      expect(result).toEqual(mockEscrowAccount);
    });
  });

  describe('depositFunds', () => {
    it('should deposit funds to escrow', async () => {
      const depositData = {
        projectId: 'project123',
        amount: 500,
        paymentMethodId: 'pm_123'
      };

      const mockEscrowAccount = {
        projectId: 'project123',
        totalHeld: 5500,
        totalReleased: 2000,
        remaining: 3500,
        status: 'HELD',
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockEscrowAccount });

      const result = await paymentService.depositFunds(depositData);

      expect(apiClient.post).toHaveBeenCalledWith('/payments/deposit', depositData);
      expect(result).toEqual(mockEscrowAccount);
    });
  });

  describe('getTransactions', () => {
    it('should fetch user transactions', async () => {
      const mockTransactions = [
        { id: 'tx1', amount: 1000, type: 'DEPOSIT', status: 'COMPLETED' },
        { id: 'tx2', amount: 500, type: 'MILESTONE_RELEASE', status: 'COMPLETED' },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockTransactions });

      const result = await paymentService.getTransactions('user123');

      expect(apiClient.get).toHaveBeenCalledWith('/payments/transactions?userId=user123');
      expect(result).toEqual(mockTransactions);
    });

    it('should fetch user transactions with filters', async () => {
      const mockTransactions = [
        { id: 'tx1', amount: 1000, type: 'DEPOSIT', status: 'COMPLETED' },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockTransactions });

      const result = await paymentService.getTransactions('user123', { 
        type: 'DEPOSIT', 
        projectId: 'project123' 
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/payments/transactions?userId=user123&type=DEPOSIT&projectId=project123'
      );
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('getUserBalance', () => {
    it('should fetch user balance', async () => {
      const mockBalance = {
        userId: 'user123',
        availableBalance: 2500,
        pendingBalance: 500,
        currency: 'USD'
      };

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockBalance });

      const result = await paymentService.getUserBalance('user123');

      expect(apiClient.get).toHaveBeenCalledWith('/payments/balance/user123');
      expect(result).toEqual(mockBalance);
    });
  });

  describe('getPayouts', () => {
    it('should fetch user payouts', async () => {
      const mockPayouts = [
        { id: 'po1', amount: 1000, status: 'completed' },
        { id: 'po2', amount: 500, status: 'pending' },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockPayouts });

      const result = await paymentService.getPayouts('user123');

      expect(apiClient.get).toHaveBeenCalledWith('/payments/payouts/user123');
      expect(result).toEqual(mockPayouts);
    });
  });

  describe('createPayout', () => {
    it('should create a new payout', async () => {
      const payoutData = {
        userId: 'user123',
        amount: 1000,
        payoutMethod: 'BANK_TRANSFER'
      };

      const mockPayout = {
        id: 'payout456',
        userId: 'user123',
        amount: 100000,
        method: 'bank-transfer',
        status: 'processing',
        createdAt: new Date(),
      };

      (apiClient.post as jest.Mock).mockResolvedValue({ data: mockPayout });

      const result = await paymentService.createPayout(payoutData);

      expect(apiClient.post).toHaveBeenCalledWith('/payments/payouts', payoutData);
      expect(result).toEqual(mockPayout);
    });
  });

  describe('getPaymentMethods', () => {
    it('should fetch user payment methods', async () => {
      const mockPaymentMethods = [
        { id: 'pm1', type: 'card', brand: 'visa', last4: '1234' },
        { id: 'pm2', type: 'bank_account', last4: '5678' },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockPaymentMethods });

      const result = await paymentService.getPaymentMethods('user123');

      expect(apiClient.get).toHaveBeenCalledWith('/payments/methods/user123');
      expect(result).toEqual(mockPaymentMethods);
    });
  });
});