const {
  getProjects,
  getProject,
  createProject,
  inviteFreelancer,
  acceptInvitation,
  depositFunds,
  cancelProject
} = require('../../controllers/projectController');
const { Project, Milestone, User, Transaction, Dispute } = require('../../models/modelManager');
const { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } = require('../../errors/AppError');
const stripeService = require('../../services/paymentService');
const { processAIAnalysis } = require('../../services/aiService');
const contentModerationService = require('../../services/contentModerationService');
const { notifyProject } = require('../../socket/server');

// Mock the external dependencies
jest.mock('../../models/modelManager');
jest.mock('../../services/paymentService');
jest.mock('../../services/aiService');
jest.mock('../../services/contentModerationService');
jest.mock('../../socket/server');

describe('ProjectController', () => {
  let mockReq, mockRes, mockNext, mockUserModel, mockProjectModel, mockMilestoneModel, mockTransactionModel, mockDisputeModel;

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
    mockProjectModel = {
      find: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      save: jest.fn()
    };

    mockMilestoneModel = {
      create: jest.fn()
    };

    mockUserModel = {
      findById: jest.fn(),
      findOne: jest.fn()
    };

    mockTransactionModel = {
      create: jest.fn()
    };

    mockDisputeModel = {
      find: jest.fn()
    };

    // Assign mocks
    Project.find = mockProjectModel.find;
    Project.findById = mockProjectModel.findById;
    Project.create = mockProjectModel.create;
    Project.findByIdAndUpdate = mockProjectModel.findByIdAndUpdate;
    Project.save = mockProjectModel.save;
    
    Milestone.create = mockMilestoneModel.create;
    
    User.findById = mockUserModel.findById;
    User.findOne = mockUserModel.findOne;
    
    Transaction.create = mockTransactionModel.create;
    
    Dispute.find = mockDisputeModel.find;
  });

  describe('getProjects', () => {
    it('should return projects for the authenticated user', async () => {
      // Arrange
      mockReq.user = { userId: 'user123' };
      mockReq.query = {};
      
      const mockProjects = [
        { _id: 'proj1', title: 'Project 1', client: 'user123' },
        { _id: 'proj2', title: 'Project 2', freelancer: 'user123' }
      ];
      mockProjectModel.find.mockResolvedValue(mockProjects);

      // Act
      await getProjects(mockReq, mockRes, mockNext);

      // Assert
      expect(mockProjectModel.find).toHaveBeenCalledWith({
        $or: [
          { client: 'user123' },
          { freelancer: 'user123' }
        ]
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        items: mockProjects,
        pagination: {
          total: mockProjects.length,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      });
    });

    it('should return projects with status filter', async () => {
      // Arrange
      mockReq.user = { userId: 'user123' };
      mockReq.query = { status: 'ACTIVE' };
      
      const mockProjects = [
        { _id: 'proj1', title: 'Project 1', client: 'user123', status: 'ACTIVE' }
      ];
      mockProjectModel.find.mockResolvedValue(mockProjects);

      // Act
      await getProjects(mockReq, mockRes, mockNext);

      // Assert
      expect(mockProjectModel.find).toHaveBeenCalledWith({
        $or: [
          { client: 'user123' },
          { freelancer: 'user123' }
        ],
        status: 'ACTIVE'
      });
    });
  });

  describe('getProject', () => {
    it('should return project if user is authorized', async () => {
      // Arrange
      mockReq.params = { id: 'proj123' };
      mockReq.user = { userId: 'client123' };
      
      const mockProject = {
        _id: 'proj123',
        title: 'Test Project',
        client: 'client123',
        freelancer: 'freelancer456'
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await getProject(mockReq, mockRes, mockNext);

      // Assert
      expect(mockProjectModel.findById).toHaveBeenCalledWith('proj123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockProject);
    });

    it('should return forbidden error if user is not authorized', async () => {
      // Arrange
      mockReq.params = { id: 'proj123' };
      mockReq.user = { userId: 'other-user' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123',
        freelancer: 'freelancer456'
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await getProject(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('createProject', () => {
    it('should create project with validated inputs', async () => {
      // Arrange
      mockReq.body = {
        title: 'New Project',
        description: 'Project description',
        category: 'Development',
        budget: 100000, // $1000 in cents
        deadline: '2024-12-31T23:59:59Z',
        milestones: [
          {
            title: 'Milestone 1',
            description: 'First milestone',
            amount: 30000, // $300 in cents
            deadline: '2024-06-30T23:59:59Z',
            acceptanceCriteria: 'Criteria for milestone 1'
          },
          {
            title: 'Milestone 2',
            description: 'Second milestone',
            amount: 70000, // $700 in cents
            deadline: '2024-12-31T23:59:59Z',
            acceptanceCriteria: 'Criteria for milestone 2'
          }
        ],
        autoApproveDays: 7
      };
      mockReq.user = { userId: 'client123' };

      const mockUser = {
        _id: 'client123',
        role: 'client'
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      const mockNewProject = {
        _id: 'new-proj-123',
        title: 'New Project',
        description: 'Project description',
        client: 'client123',
        status: 'DRAFT',
        milestones: [],
        activityLog: [],
        save: jest.fn()
      };
      mockProjectModel.create.mockResolvedValue(mockNewProject);

      const mockNewMilestone1 = {
        _id: 'mile1',
        title: 'Milestone 1',
        save: jest.fn()
      };
      const mockNewMilestone2 = {
        _id: 'mile2',
        title: 'Milestone 2',
        save: jest.fn()
      };
      mockMilestoneModel.create
        .mockResolvedValueOnce(mockNewMilestone1)
        .mockResolvedValueOnce(mockNewMilestone2);

      // Mock content moderation to approve content
      contentModerationService.moderateProject.mockResolvedValue({
        isApproved: true
      });

      // Act
      await createProject(mockReq, mockRes, mockNext);

      // Assert
      expect(mockUserModel.findById).toHaveBeenCalledWith('client123');
      expect(contentModerationService.moderateProject).toHaveBeenCalledWith({
        _id: null,
        title: 'New Project',
        description: 'Project description'
      });
      expect(mockProjectModel.create).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Project',
        description: 'Project description',
        category: 'Development',
        budget: 100000,
        client: 'client123',
        status: 'DRAFT'
      }));
      expect(mockMilestoneModel.create).toHaveBeenCalledTimes(2);
      expect(mockNewProject.milestones).toContainEqual('mile1');
      expect(mockNewProject.milestones).toContainEqual('mile2');
      expect(mockNewProject.activityLog).toContainEqual(expect.objectContaining({
        action: 'PROJECT_CREATED'
      }));
      expect(mockNewProject.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockNewProject);
    });

    it('should reject project with invalid budget', async () => {
      // Arrange
      mockReq.body = {
        title: 'New Project',
        description: 'Project description',
        category: 'Development',
        budget: 4000, // Less than minimum $50
        deadline: '2024-12-31T23:59:59Z',
        milestones: [
          {
            title: 'Milestone 1',
            description: 'First milestone',
            amount: 4000, // Less than minimum $50
            deadline: '2024-06-30T23:59:59Z',
            acceptanceCriteria: 'Criteria for milestone 1'
          }
        ]
      };
      mockReq.user = { userId: 'client123' };

      const mockUser = {
        _id: 'client123',
        role: 'client'
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      // Act
      await createProject(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should reject project if user is not a client', async () => {
      // Arrange
      mockReq.body = {
        title: 'New Project',
        description: 'Project description',
        category: 'Development',
        budget: 100000,
        deadline: '2024-12-31T23:59:59Z',
        milestones: []
      };
      mockReq.user = { userId: 'freelancer123' };

      const mockUser = {
        _id: 'freelancer123',
        role: 'freelancer' // Not a client
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      // Act
      await createProject(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should return error if content is flagged by moderation', async () => {
      // Arrange
      mockReq.body = {
        title: 'Inappropriate Project',
        description: 'Contains inappropriate content',
        category: 'Development',
        budget: 100000,
        deadline: '2024-12-31T23:59:59Z',
        milestones: []
      };
      mockReq.user = { userId: 'client123' };

      const mockUser = {
        _id: 'client123',
        role: 'client'
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      // Mock content moderation to flag content
      contentModerationService.moderateProject.mockResolvedValue({
        isApproved: false,
        message: 'Project contains inappropriate content'
      });

      // Act
      await createProject(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('inviteFreelancer', () => {
    it('should invite freelancer to project', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123' };
      mockReq.body = { email: 'freelancer@example.com' };
      mockReq.user = { userId: 'client123' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123',
        status: 'DRAFT',
        freelancer: null,
        save: jest.fn()
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);
      
      const mockFreelancer = {
        _id: 'freelancer456',
        email: 'freelancer@example.com',
        role: 'freelancer'
      };
      mockUserModel.findOne.mockResolvedValue(mockFreelancer);

      // Act
      await inviteFreelancer(mockReq, mockRes, mockNext);

      // Assert
      expect(mockProjectModel.findById).toHaveBeenCalledWith('proj123');
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'freelancer@example.com',
        role: 'freelancer'
      });
      expect(mockProject.freelancer).toBe('freelancer456');
      expect(mockProject.status).toBe('PENDING_ACCEPTANCE');
      expect(mockProject.save).toHaveBeenCalled();
      expect(mockProject.activityLog).toContainEqual(expect.objectContaining({
        action: 'FREELANCER_INVITED'
      }));
      expect(mockProject.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Freelancer invited successfully',
        project: mockProject
      });
    });

    it('should return error if user is not project client', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123' };
      mockReq.body = { email: 'freelancer@example.com' };
      mockReq.user = { userId: 'other-user' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123' // Different client
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await inviteFreelancer(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should return error if project is not in DRAFT status', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123' };
      mockReq.body = { email: 'freelancer@example.com' };
      mockReq.user = { userId: 'client123' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123',
        status: 'ACTIVE' // Not DRAFT
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await inviteFreelancer(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });

    it('should return error if freelancer does not exist', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123' };
      mockReq.body = { email: 'nonexistent@example.com' };
      mockReq.user = { userId: 'client123' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123',
        status: 'DRAFT'
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);
      
      mockUserModel.findOne.mockResolvedValue(null); // Freelancer doesn't exist

      // Act
      await inviteFreelancer(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('acceptInvitation', () => {
    it('should accept project invitation', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123' };
      mockReq.user = { userId: 'freelancer456' };
      
      const mockProject = {
        _id: 'proj123',
        freelancer: 'freelancer456',
        status: 'PENDING_ACCEPTANCE',
        save: jest.fn()
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await acceptInvitation(mockReq, mockRes, mockNext);

      // Assert
      expect(mockProjectModel.findById).toHaveBeenCalledWith('proj123');
      expect(mockProject.status).toBe('AWAITING_DEPOSIT');
      expect(mockProject.save).toHaveBeenCalled();
      expect(mockProject.activityLog).toContainEqual(expect.objectContaining({
        action: 'INVITATION_ACCEPTED'
      }));
      expect(mockProject.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Project invitation accepted',
        project: mockProject
      });
    });

    it('should return error if user is not the invited freelancer', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123' };
      mockReq.user = { userId: 'other-freelancer' };
      
      const mockProject = {
        _id: 'proj123',
        freelancer: 'freelancer456' // Different freelancer
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await acceptInvitation(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should return error if project is not pending acceptance', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123' };
      mockReq.user = { userId: 'freelancer456' };
      
      const mockProject = {
        _id: 'proj123',
        freelancer: 'freelancer456',
        status: 'ACTIVE' // Not pending acceptance
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await acceptInvitation(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('depositFunds', () => {
    it('should deposit funds to project escrow', async () => {
      // Arrange
      mockReq.body = {
        projectId: 'proj123',
        paymentMethodId: 'pm_123456'
      };
      mockReq.user = { userId: 'client123' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123',
        status: 'AWAITING_DEPOSIT',
        budget: 100000, // $1000 in cents
        escrow: {
          status: 'NOT_DEPOSITED',
          totalHeld: 0,
          totalReleased: 0,
          remaining: 0
        },
        paymentSchedule: {
        clientFeePercent: 1.9,
        freelancerFeePercent: 3.6,
        totalFeePercent: 5.5
      },
        milestones: [],
        activityLog: [],
        save: jest.fn()
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);
      
      const mockClient = {
        _id: 'client123',
        stripeCustomerId: 'cus_123456'
      };
      mockUserModel.findById.mockResolvedValue(mockClient);

      // Mock Stripe payment intent
      stripeService.createPaymentIntent.mockResolvedValue({
        id: 'pi_abcdef',
        status: 'succeeded'
      });

      const mockTransaction = {
        _id: 'tx_7890',
        save: jest.fn()
      };
      mockTransactionModel.create.mockResolvedValue(mockTransaction);

      // Act
      await depositFunds(mockReq, mockRes, mockNext);

      // Assert
      expect(mockProjectModel.findById).toHaveBeenCalledWith('proj123');
      expect(mockUserModel.findById).toHaveBeenCalledWith('client123');
      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        1025, // Total with 2.5% platform fee ($1000 + $25)
        'usd',
        'Deposit for project: undefined', // Title is undefined because project is a mock
        'pm_123456',
        'cus_123456'
      );
      expect(mockProject.status).toBe('ACTIVE');
      expect(mockProject.escrow).toMatchObject({
        status: 'HELD',
        totalHeld: 100000,
        totalReleased: 0,
        remaining: 100000
      });
      expect(mockProject.save).toHaveBeenCalled();
      expect(mockTransactionModel.create).toHaveBeenCalledWith(expect.objectContaining({
        projectId: 'proj123',
        type: 'DEPOSIT',
        amount: 100000,
        from: 'client123',
        to: null,
        status: 'COMPLETED',
        provider: 'stripe',
        providerTransactionId: 'pi_abcdef'
      }));
      expect(mockProject.activityLog).toContainEqual(expect.objectContaining({
        action: 'FUNDS_DEPOSITED'
      }));
      expect(mockProject.save).toHaveBeenCalled();
      expect(notifyProject).toHaveBeenCalledWith('proj123', 'funds-deposited', expect.any(Object));
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        project: mockProject,
        paymentIntent: expect.objectContaining({
          id: 'pi_abcdef',
          status: 'succeeded'
        })
      }));
    });

    it('should return error if user is not project client', async () => {
      // Arrange
      mockReq.body = { projectId: 'proj123' };
      mockReq.user = { userId: 'other-user' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123' // Different client
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await depositFunds(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should return error if project is not in awaiting deposit status', async () => {
      // Arrange
      mockReq.body = { projectId: 'proj123' };
      mockReq.user = { userId: 'client123' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123',
        status: 'ACTIVE' // Not awaiting deposit
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Act
      await depositFunds(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });

  describe('cancelProject', () => {
    it('should cancel project if user is authorized', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123' };
      mockReq.user = { userId: 'client123' }; // Client can cancel
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123',
        freelancer: 'freelancer456',
        status: 'AWAITING_DEPOSIT',
        save: jest.fn()
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Mock milestone counts
      const Milestone = require('../../models/Milestone');
      Milestone.countDocuments = jest.fn().mockResolvedValue(0); // No active milestones

      // Act
      await cancelProject(mockReq, mockRes, mockNext);

      // Assert
      expect(mockProjectModel.findById).toHaveBeenCalledWith('proj123');
      expect(mockProject.status).toBe('CANCELLED');
      expect(mockProject.save).toHaveBeenCalled();
      expect(mockProject.activityLog).toContainEqual(expect.objectContaining({
        action: 'PROJECT_CANCELLED'
      }));
      expect(mockProject.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Project cancelled successfully',
        project: mockProject
      });
    });

    it('should return error if user is not authorized', async () => {
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
      await cancelProject(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should return error if project has active milestones', async () => {
      // Arrange
      mockReq.params = { projectId: 'proj123' };
      mockReq.user = { userId: 'client123' };
      
      const mockProject = {
        _id: 'proj123',
        client: 'client123',
        status: 'ACTIVE'
      };
      mockProjectModel.findById.mockResolvedValue(mockProject);

      // Mock milestone counts to return 5 active milestones
      const Milestone = require('../../models/Milestone');
      Milestone.countDocuments = jest.fn().mockResolvedValue(5); // Has active milestones

      // Act
      await cancelProject(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(BadRequestError));
    });
  });
});