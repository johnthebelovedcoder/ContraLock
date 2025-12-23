const fraudDetectionService = require('../../services/fraudDetectionService');
const { User, Project, Transaction, Dispute, Milestone } = require('../../models/modelManager');

// Mock the external dependencies
jest.mock('../../models/modelManager');

describe('FraudDetectionService', () => {
  let mockUserModel, mockProjectModel, mockTransactionModel, mockDisputeModel, mockMilestoneModel;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock models
    mockUserModel = {
      findById: jest.fn(),
      countDocuments: jest.fn()
    };

    mockProjectModel = {
      find: jest.fn(),
      countDocuments: jest.fn()
    };

    mockTransactionModel = {
      find: jest.fn(),
      countDocuments: jest.fn()
    };

    mockDisputeModel = {
      find: jest.fn(),
      countDocuments: jest.fn()
    };

    mockMilestoneModel = {
      find: jest.fn()
    };

    // Assign mocked models
    User.findById = mockUserModel.findById;
    User.countDocuments = mockUserModel.countDocuments;
    
    Project.find = mockProjectModel.find;
    Project.countDocuments = mockProjectModel.countDocuments;
    
    Transaction.find = mockTransactionModel.find;
    Transaction.countDocuments = mockTransactionModel.countDocuments;
    
    Dispute.find = mockDisputeModel.find;
    Dispute.countDocuments = mockDisputeModel.countDocuments;
    
    Milestone.find = mockMilestoneModel.find;
  });

  describe('checkUserFraudRisk', () => {
    it('should calculate risk score based on account age', async () => {
      // Arrange
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        createdAt: new Date(Date.now() - 10000), // Very recent (10 seconds ago)
        loginFailedAttempts: 0
      };
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockProjectModel.find.mockResolvedValue([]);
      mockTransactionModel.find.mockResolvedValue([]);

      // Act
      const result = await fraudDetectionService.checkUserFraudRisk(userId);

      // Assert
      expect(result.userId).toBe(userId);
      expect(result.riskScore).toBeGreaterThan(25); // Account created very recently should increase risk
      expect(result.riskLevel).toBeGreaterThanOrEqual('LOW');
      expect(result.riskFactors).toContain('Account created very recently');
    });

    it('should calculate risk score based on failed login attempts', async () => {
      // Arrange
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        loginFailedAttempts: 10
      };
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockProjectModel.find.mockResolvedValue([]);
      mockTransactionModel.find.mockResolvedValue([]);

      // Act
      const result = await fraudDetectionService.checkUserFraudRisk(userId);

      // Assert
      expect(result.riskScore).toBeGreaterThanOrEqual(20); // Multiple failed login attempts increase risk
      expect(result.riskFactors).toContain('Multiple failed login attempts');
    });

    it('should calculate risk based on project creation velocity', async () => {
      // Arrange
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        loginFailedAttempts: 0
      };
      mockUserModel.findById.mockResolvedValue(mockUser);
      
      // Create 15 recent projects
      const recentProjects = [];
      for (let i = 0; i < 15; i++) {
        recentProjects.push({
          _id: `proj${i}`,
          client: userId,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
        });
      }
      mockProjectModel.find.mockResolvedValue(recentProjects);
      
      mockTransactionModel.find.mockResolvedValue([]);

      // Act
      const result = await fraudDetectionService.checkUserFraudRisk(userId);

      // Assert
      expect(result.riskScore).toBeGreaterThanOrEqual(25); // Many projects in 7 days increase risk
      expect(result.riskFactors).toContain('Created 15 projects in last 7 days');
    });

    it('should calculate risk based on transaction velocity', async () => {
      // Arrange
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        loginFailedAttempts: 0
      };
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockProjectModel.find.mockResolvedValue([]);
      
      // Create 20 recent transactions
      const recentTransactions = [];
      for (let i = 0; i < 20; i++) {
        recentTransactions.push({
          _id: `tx${i}`,
          from: userId,
          createdAt: new Date(Date.now() - 20 * 60 * 1000) // 20 minutes ago
        });
      }
      mockTransactionModel.find.mockResolvedValue(recentTransactions);

      // Act
      const result = await fraudDetectionService.checkUserFraudRisk(userId);

      // Assert
      expect(result.riskScore).toBeGreaterThanOrEqual(20); // Many transactions in 24 hours increase risk
      expect(result.riskFactors).toContain('Processed 20 transactions in last 24 hours');
    });

    it('should return low risk for normal user profile', async () => {
      // Arrange
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        loginFailedAttempts: 0
      };
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockProjectModel.find.mockResolvedValue([]);
      mockTransactionModel.find.mockResolvedValue([]);

      // Act
      const result = await fraudDetectionService.checkUserFraudRisk(userId);

      // Assert
      expect(result.riskLevel).toBeLessThan('MEDIUM'); // Should be low/very low
      expect(result.riskFactors).toHaveLength(0); // No risk factors for normal user
    });
  });

  describe('checkPaymentFraud', () => {
    it('should detect unusually large transactions', async () => {
      // Arrange
      const transaction = {
        _id: 'tx123',
        from: 'user123',
        amount: 1000000, // $10,000 - much larger than average
        type: 'MILESTONE_RELEASE'
      };
      
      // Mock: return low average transaction amount
      const mockTransactions = [
        { amount: 1000 }, // $10
        { amount: 2000 }, // $20
        { amount: 1500 }  // $15
      ];
      mockTransactionModel.find.mockResolvedValue(mockTransactions);

      // Act
      const result = await fraudDetectionService.checkPaymentFraud(transaction);

      // Assert
      expect(result.riskScore).toBeGreaterThanOrEqual(25); // Large transaction increases risk
      expect(result.riskFactors).toContain('Transaction significantly larger than average');
    });

    it('should detect rapid succession of payments', async () => {
      // Arrange
      const transaction = {
        _id: 'tx123',
        from: 'user123',
        amount: 10000, // $100
        type: 'MILESTONE_RELEASE'
      };
      
      // Mock: return 10 similar transactions in last hour
      const mockTransactions = [];
      for (let i = 0; i < 10; i++) {
        mockTransactions.push({
          _id: `tx${i}`,
          from: 'user123',
          type: 'MILESTONE_RELEASE',
          createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        });
      }
      mockTransactionModel.find.mockResolvedValue(mockTransactions);

      // Act
      const result = await fraudDetectionService.checkPaymentFraud(transaction);

      // Assert
      expect(result.riskScore).toBeGreaterThanOrEqual(20); // Multiple transactions in short time increase risk
      expect(result.riskFactors).toContain('Multiple similar transactions in short time');
    });

    it('should return low risk for normal transaction', async () => {
      // Arrange
      const transaction = {
        _id: 'tx123',
        from: 'user123',
        amount: 5000, // $50
        type: 'MILESTONE_RELEASE'
      };
      
      // Mock: return average transactions
      const mockTransactions = [
        { amount: 4500 },
        { amount: 5500 },
        { amount: 6000 }
      ];
      mockTransactionModel.find.mockResolvedValue(mockTransactions);

      // Act
      const result = await fraudDetectionService.checkPaymentFraud(transaction);

      // Assert
      expect(result.riskScore).toBeLessThan(20); // Normal transaction
      expect(result.riskFactors).not.toContain('Transaction significantly larger than average');
    });
  });

  describe('checkDisputeFraud', () => {
    it('should detect disputes raised immediately after submission', async () => {
      // Arrange
      const disputeId = 'dispute123';
      const mockDispute = {
        _id: disputeId,
        project: { _id: 'proj123' },
        milestone: { 
          _id: 'milestone123',
          submittedAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
        },
        reason: 'Work not completed properly',
        createdAt: new Date(Date.now()) // Just now
      };
      mockDisputeModel.findById.mockResolvedValue(mockDispute);
      mockDisputeModel.populate = jest.fn().mockReturnThis(); // Mock populate chain

      // Act
      const result = await fraudDetectionService.checkDisputeFraud(disputeId);

      // Assert
      expect(result.riskScore).toBeGreaterThanOrEqual(30); // Disputed within 10 minutes increases risk
      expect(result.riskFactors).toContain('Disputed extremely quickly after submission');
    });

    it('should detect user with high dispute frequency', async () => {
      // Arrange
      const disputeId = 'dispute123';
      const mockDispute = {
        _id: disputeId,
        project: { _id: 'proj123' },
        milestone: { 
          _id: 'milestone123',
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        },
        raisedBy: { _id: 'user123' },
        reason: 'Work not completed properly',
        createdAt: new Date(Date.now())
      };
      
      // Mock populate chain
      mockDisputeModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDispute)
      });
      mockDisputeModel.countDocuments.mockResolvedValue(10); // High dispute count

      // Act
      const result = await fraudDetectionService.checkDisputeFraud(disputeId);

      // Assert
      expect(result.riskScore).toBeGreaterThanOrEqual(20); // High dispute frequency increases risk
      expect(result.riskFactors).toContain('User raised 10 disputes in last 30 days');
    });

    it('should detect generic dispute reasons', async () => {
      // Arrange
      const disputeId = 'dispute123';
      const mockDispute = {
        _id: disputeId,
        project: { _id: 'proj123' },
        milestone: { 
          _id: 'milestone123',
          submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
        },
        raisedBy: { _id: 'user123' },
        reason: 'not good', // Generic reason
        createdAt: new Date(Date.now())
      };
      
      mockDisputeModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockDispute)
      });
      mockDisputeModel.countDocuments.mockResolvedValue(1); // Low dispute count

      // Act
      const result = await fraudDetectionService.checkDisputeFraud(disputeId);

      // Assert
      expect(result.riskScore).toBeGreaterThanOrEqual(15); // Generic reason increases risk
      expect(result.riskFactors).toContain('Generic dispute reason');
    });
  });

  describe('monitorAccount', () => {
    it('should monitor account and return profile', async () => {
      // Arrange
      const userId = 'user123';
      const mockProfile = {
        userId,
        riskScore: 10,
        riskLevel: 'LOW',
        riskFactors: []
      };
      
      // Mock the checkUserFraudRisk function
      jest.spyOn(fraudDetectionService, 'checkUserFraudRisk')
        .mockResolvedValue(mockProfile);

      // Act
      const result = await fraudDetectionService.monitorAccount(userId);

      // Assert
      expect(result).toEqual(mockProfile);
      expect(fraudDetectionService.checkUserFraudRisk).toHaveBeenCalledWith(userId);
    });
  });
});