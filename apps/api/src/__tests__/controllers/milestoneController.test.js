const {
  getMilestones,
  getMilestone,
  createMilestone,
  startMilestone,
  submitMilestone,
  approveMilestone,
  requestRevision,
  autoApproveMilestone
} = require('../../controllers/milestoneController');
const { Milestone, Project, Transaction } = require('../../models/modelManager');
const { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } = require('../../errors/AppError');
const stripeService = require('../../services/paymentService');
const { processAIAnalysis } = require('../../services/aiService');
const { notifyProject } = require('../../socket/server');

// Mock the external dependencies
jest.mock('../../models/modelManager');
jest.mock('../../services/paymentService');
jest.mock('../../services/aiService');
jest.mock('../../socket/server');

describe('MilestoneController', () => {
  let mockReq, mockRes, mockNext, mockUserModel, mockMilestoneModel, mockProjectModel, mockTransactionModel;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      body: {},
      query: {},
      user: { userId: 'user123' }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };

    mockNext = jest.fn();

    // Mock models
    mockMilestoneModel = {
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn()
    };

    mockProjectModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      save: jest.fn()
    };

    mockTransactionModel = {
      create: jest.fn()
    };

    // Assign mocks
    Milestone.find = mockMilestoneModel.find;
    Milestone.findById = mockMilestoneModel.findById;
    Milestone.create = mockMilestoneModel.create;
    Milestone.findByIdAndUpdate = mockMilestoneModel.findByIdAndUpdate;
    
    Project.findById = mockProjectModel.findById;
    Project.findByIdAndUpdate = mockProjectModel.findByIdAndUpdate;
    Project.save = mockProjectModel.save;
    
    Transaction.create = mockTransactionModel.create;
  });

  describe('getMilestones', () => {
    it('should return milestones for project if user is authorized', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123' };
      mockReq.user = { userId: 'client123' }; // Client user
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123'
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);
      
      const mockMilestones = [
        { _id: 'mile1', project: 'proj123', title: 'Milestone 1' },
        { _id: 'mile2', project: 'proj123', title: 'Milestone 2' }
      ];
      mockMilestoneModel.find.mockResolvedValue(mockMilestones);

      // Act
      await getMilestones(mockReq, mockRes, mockNext);

      // Assert
      expect(mockProjectModel.findById).toHaveBeenCalledWith('proj123');
      expect(mockMilestoneModel.find).toHaveBeenCalledWith({ project: 'proj123' });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockMilestones);
    });

    it('should return forbidden error if user is not authorized', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123' };
      mockReq.user = { userId: 'other-user' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123',
        freelancer: 'freelancer456'
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await getMilestones(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should return not found error if project does not exist', async () => {
      // Arrange
      mockReq.params = { projectId: 'nonexistent' };
      mockProjectModel.findById.mockResolvedValue(null);

      // Act
      await getMilestones(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('getMilestone', () => {
    it('should return milestone if user is authorized', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123', milestoneId: 'mile123' };
      mockReq.user = { userId: 'freelancer456' }; // Freelancer user
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123',
        freelancer: 'freelancer456'
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);
      
      const mockMilestone = {
        _id: 'mile123',
        project: 'proj123',
        title: 'Test Milestone'
      };
      mockMilestoneModel.findById.mockResolvedValue(mockMilestone);

      // Act
      await getMilestone(mockReq, mockRes, mockNext);

      // Assert
      expect(mockProjectModel.findById).toHaveBeenCalledWith('proj123');
      expect(mockMilestoneModel.findById).toHaveBeenCalledWith('mile123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockMilestone);
    });

    it('should return not found error if milestone does not belong to project', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123', milestoneId: 'mile456' };
      mockReq.user = { userId: 'client123' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123'
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);
      
      const mockMilestone = {
        _id: 'mile456',
        project: 'different-project' // Different project
      };
      mockMilestoneModel.findById.mockResolvedValue(mockMilestone);

      // Act
      await getMilestone(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('createMilestone', () => {
    it('should create milestone if user is project client', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123' };
      mockReq.body = {
        title: 'New Milestone',
        description: 'New milestone description',
        amount: 5000,
        deadline: '2023-12-31T23:59:59Z',
        acceptanceCriteria: 'Acceptance criteria'
      };
      mockReq.user = { userId: 'client123' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123',
        milestones: [],
        budget: 10000,
        activityLog: [],
        save: jest.fn()
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);
      
      const mockNewMilestone = {
        _id: 'new-milestone',
        title: 'New Milestone',
        description: 'New milestone description',
        amount: 5000,
        deadline: '2023-12-31T23:59:59Z',
        acceptanceCriteria: 'Acceptance criteria',
        project: 'proj123',
        status: 'PENDING'
      };
      mockMilestoneModel.create.mockResolvedValue(mockNewMilestone);

      // Mock content moderation
      jest.doMock('../../services/contentModerationService', () => ({
        moderateMilestone: jest.fn().mockResolvedValue({ isApproved: true })
      }));

      // Act
      await createMilestone(mockReq, mockRes, mockNext);

      // Assert
      expect(mockProjectModel.findById).toHaveBeenCalledWith('proj123');
      expect(mockMilestoneModel.create).toHaveBeenCalledWith(mockNewMilestone);
      expect(mockProject.milestones).toContainEqual('new-milestone'); // Added to project
      expect(mockProject.activityLog).toContainEqual(expect.objectContaining({
        action: 'MILESTONE_CREATED'
      }));
      expect(mockProject.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockNewMilestone);
    });

    it('should return error if user is not project client', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123' };
      mockReq.user = { userId: 'other-user' }; // Not client
      mockReq.body = {
        title: 'New Milestone',
        description: 'Description',
        amount: 5000
      };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123' // Different client
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await createMilestone(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should return error if milestone content is flagged', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123' };
      mockReq.user = { userId: 'client123' };
      mockReq.body = {
        title: 'Abusive Milestone',
        description: 'Inappropriate content',
        amount: 5000
      };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123'
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Mock content moderation service to return flagged content
      const contentModerationService = require('../../services/contentModerationService');
      contentModerationService.moderateMilestone.mockResolvedValue({
        isApproved: false,
        message: 'Content contains inappropriate language'
      });

      // Act
      await createMilestone(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('startMilestone', () => {
    it('should start milestone if freelancer is assigned', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123', milestoneId: 'mile123' };
      mockReq.user = { userId: 'freelancer456' };
      
      const mockProject = {
        _id: 'proj123',
        freelancer: 'freelancer456',
        activityLog: [],
        save: jest.fn()
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);
      
      const mockMilestone = {
        _id: 'mile123',
        project: 'proj123',
        status: 'PENDING',
        save: jest.fn()
      };
      mockMilestoneModel.findById.mockResolvedValue(mockMilestone);

      // Act
      await startMilestone(mockReq, mockRes, mockNext);

      // Assert
      expect(mockMilestone.status).toBe('IN_PROGRESS');
      expect(mockMilestone.startedAt).toBeDefined();
      expect(mockMilestone.save).toHaveBeenCalled();
      expect(mockProject.activityLog).toContainEqual(expect.objectContaining({
        action: 'MILESTONE_STARTED'
      }));
      expect(mockProject.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockMilestone);
    });

    it('should return error if user is not freelancer', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123', milestoneId: 'mile123' };
      mockReq.user = { userId: 'other-user' }; // Not freelancer
      
      const mockProject = {
        _id: 'proj123',
        freelancer: 'freelancer456' // Different freelancer
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await startMilestone(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should return error if milestone is not in PENDING state', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123', milestoneId: 'mile123' };
      mockReq.user = { userId: 'freelancer456' };
      
      const mockProject = {
        _id: 'proj123',
        freelancer: 'freelancer456'
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);
      
      const mockMilestone = {
        _id: 'mile123',
        project: 'proj123',
        status: 'SUBMITTED' // Not PENDING
      };
      mockMilestoneModel.findById.mockResolvedValue(mockMilestone);

      // Act
      await startMilestone(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('submitMilestone', () => {
    it('should submit milestone successfully', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123', milestoneId: 'mile123' };
      mockReq.body = {
        deliverables: [{ filename: 'file1.pdf', url: '/uploads/file1.pdf' }],
        submissionNotes: 'Initial submission'
      };
      mockReq.user = { userId: 'freelancer456' };
      
      const mockProject = {
        _id: 'proj123',
        freelancer: 'freelancer456',
        activityLog: [],
        save: jest.fn()
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);
      
      const mockMilestone = {
        _id: 'mile123',
        project: 'proj123',
        status: 'IN_PROGRESS',
        deliverables: [],
        submissionNotes: '',
        submittedAt: null,
        save: jest.fn()
      };
      mockMilestoneModel.findById.mockResolvedValue(mockMilestone);

      // Act
      await submitMilestone(mockReq, mockRes, mockNext);

      // Assert
      expect(mockMilestone.status).toBe('SUBMITTED');
      expect(mockMilestone.deliverables).toEqual([{ filename: 'file1.pdf', url: '/uploads/file1.pdf' }]);
      expect(mockMilestone.submissionNotes).toBe('Initial submission');
      expect(mockMilestone.submittedAt).toBeDefined();
      expect(mockMilestone.save).toHaveBeenCalled();
      expect(mockProject.activityLog).toContainEqual(expect.objectContaining({
        action: 'MILESTONE_SUBMITTED'
      }));
      expect(mockProject.save).toHaveBeenCalled();
      expect(notifyProject).toHaveBeenCalledWith('proj123', 'milestone-submitted', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockMilestone);
    });

    it('should return error if user is not freelancer', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123', milestoneId: 'mile123' };
      mockReq.user = { userId: 'other-user' }; // Not freelancer
      
      const mockProject = {
        _id: 'proj123',
        freelancer: 'freelancer456' // Different freelancer
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await submitMilestone(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('approveMilestone', () => {
    it('should approve milestone and release payment', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123', milestoneId: 'mile123' };
      mockReq.user = { userId: 'client123' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123',
        freelancer: 'freelancer456',
        escrow: { totalReleased: 0, remaining: 5000 },
        status: 'ACTIVE',
        save: jest.fn()
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);
      
      const mockMilestone = {
        _id: 'mile123',
        project: 'proj123',
        amount: 5000,
        status: 'SUBMITTED',
        save: jest.fn()
      };
      mockMilestoneModel.findById.mockResolvedValue(mockMilestone);

      const mockFreelancer = {
        _id: 'freelancer456',
        stripeAccountId: 'acct_123456'
      };

      // Mock User model for freelancer
      const { User } = require('../../models/modelManager');
      User.findById.mockResolvedValue(mockFreelancer);

      // Mock stripe service
      stripeService.transferToFreelancer.mockResolvedValue({
        id: 'tr_123456',
        amount: 4875 // Amount minus platform fees
      });

      const mockTransaction = {
        _id: 'tx_123456',
        save: jest.fn()
      };
      mockTransactionModel.create.mockResolvedValue(mockTransaction);

      // Act
      await approveMilestone(mockReq, mockRes, mockNext);

      // Assert
      expect(mockMilestone.status).toBe('APPROVED');
      expect(mockMilestone.approvedAt).toBeDefined();
      expect(mockMilestone.save).toHaveBeenCalled();
      
      expect(mockProject.escrow.totalReleased).toBe(5000); // Should update
      expect(mockProject.escrow.remaining).toBe(0); // Should update
      expect(mockProject.save).toHaveBeenCalled();
      expect(stripeService.transferToFreelancer).toHaveBeenCalled();
      expect(mockTransactionModel.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'MILESTONE_RELEASE',
        amount: 487500, // 4875 * 100 (in cents)
        from: null,
        to: 'freelancer456'
      }));
      expect(mockProject.activityLog).toContainEqual(expect.objectContaining({
        action: 'MILESTONE_APPROVED'
      }));
      expect(notifyProject).toHaveBeenCalledWith('proj123', 'milestone-approved', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        milestone: mockMilestone,
        transaction: mockTransaction
      });
    });

    it('should return error if user is not client', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123', milestoneId: 'mile123' };
      mockReq.user = { userId: 'other-user' }; // Not client
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123' // Different client
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await approveMilestone(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should return error if freelancer has no connected account', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123', milestoneId: 'mile123' };
      mockReq.user = { userId: 'client123' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123',
        freelancer: 'freelancer456'
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);
      
      const mockMilestone = {
        _id: 'mile123',
        project: 'proj123',
        amount: 5000,
        status: 'SUBMITTED'
      };
      mockMilestoneModel.findById.mockResolvedValue(mockMilestone);

      const mockFreelancer = {
        _id: 'freelancer456',
        stripeAccountId: null // No connected account
      };

      // Mock User model for freelancer
      const { User } = require('../../models/modelManager');
      User.findById.mockResolvedValue(mockFreelancer);

      // Act
      await approveMilestone(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('requestRevision', () => {
    it('should request revision for milestone', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123', milestoneId: 'mile123' };
      mockReq.body = { revisionNotes: 'Needs more work on design' };
      mockReq.user = { userId: 'client123' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123',
        activityLog: [],
        save: jest.fn()
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);
      
      const mockMilestone = {
        _id: 'mile123',
        project: 'proj123',
        status: 'SUBMITTED',
        revisionNotes: '',
        revisionRequestedAt: null,
        revisionHistory: [],
        save: jest.fn()
      };
      mockMilestoneModel.findById.mockResolvedValue(mockMilestone);

      // Act
      await requestRevision(mockReq, mockRes, mockNext);

      // Assert
      expect(mockMilestone.status).toBe('REVISION_REQUESTED');
      expect(mockMilestone.revisionNotes).toBe('Needs more work on design');
      expect(mockMilestone.revisionRequestedAt).toBeDefined();
      expect(mockMilestone.revisionHistory).toContainEqual(expect.objectContaining({
        requestedAt: expect.any(Date),
        requestedBy: 'client123',
        notes: 'Needs more work on design'
      }));
      expect(mockMilestone.save).toHaveBeenCalled();
      expect(mockProject.activityLog).toContainEqual(expect.objectContaining({
        action: 'REVISION_REQUESTED'
      }));
      expect(mockProject.save).toHaveBeenCalled();
      expect(notifyProject).toHaveBeenCalledWith('proj123', 'revision-requested', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockMilestone);
    });

    it('should return error if user is not client', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123', milestoneId: 'mile123' };
      mockReq.user = { userId: 'freelancer456' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123' // Different client
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await requestRevision(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });
});