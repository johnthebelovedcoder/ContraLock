const contentModerationService = require('../../services/contentModerationService');
const { Project, Milestone, Dispute, Message } = require('../../models/modelManager');

// Mock the external dependencies
jest.mock('../../models/modelManager');

describe('ContentModerationService', () => {
  let mockProjectModel, mockMilestoneModel, mockDisputeModel, mockMessageModel;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock models
    mockProjectModel = {
      findById: jest.fn(),
      find: jest.fn()
    };

    mockMilestoneModel = {
      findById: jest.fn(),
      find: jest.fn()
    };

    mockDisputeModel = {
      find: jest.fn()
    };

    mockMessageModel = {
      find: jest.fn()
    };

    // Assign mocked models
    Project.findById = mockProjectModel.findById;
    Project.find = mockProjectModel.find;
    
    Milestone.findById = mockMilestoneModel.findById;
    Milestone.find = mockMilestoneModel.find;
    
    Dispute.find = mockDisputeModel.find;
    
    Message.find = mockMessageModel.find;
  });

  describe('moderateText', () => {
    it('should flag content containing inappropriate words', async () => {
      // Arrange
      const content = 'This project contains hate and violence';
      const context = 'description';

      // Act
      const result = await contentModerationService.moderateText(content, context);

      // Assert
      expect(result.isFlagged).toBe(true);
      expect(result.flaggedWords).toContain('hate');
      expect(result.flaggedWords).toContain('violence');
      expect(result.confidence).toBeGreaterThanOrEqual(90);
    });

    it('should flag content with excessive capitalization', async () => {
      // Arrange
      const content = 'HELLO THIS IS SPAM AND ABUSE';
      const context = 'message';

      // Act
      const result = await contentModerationService.moderateText(content, context);

      // Assert
      expect(result.isFlagged).toBe(true);
      expect(result.flaggedWords).toContain('excessive caps');
      expect(result.confidence).toBeGreaterThanOrEqual(70);
    });

    it('should flag excessively long content (potential spam)', async () => {
      // Arrange
      const content = 'A'.repeat(1001); // Over 1000 chars
      const context = 'comment'; // Not description

      // Act
      const result = await contentModerationService.moderateText(content, context);

      // Assert
      expect(result.isFlagged).toBe(true);
      expect(result.flaggedWords).toContain('excessive length');
      expect(result.confidence).toBeGreaterThanOrEqual(60);
    });

    it('should pass normal content', async () => {
      // Arrange
      const content = 'This is a normal project description with appropriate content.';
      const context = 'description';

      // Act
      const result = await contentModerationService.moderateText(content, context);

      // Assert
      expect(result.isFlagged).toBe(false);
      expect(result.flaggedWords).toHaveLength(0);
      expect(result.confidence).toBeGreaterThanOrEqual(95);
    });

    it('should allow long descriptions in appropriate contexts', async () => {
      // Arrange
      const content = 'A'.repeat(1500); // Long but in description context
      const context = 'description';

      // Act
      const result = await contentModerationService.moderateText(content, context);

      // Assert
      expect(result.isFlagged).toBe(false);
      expect(result.flaggedWords).toHaveLength(0);
    });
  });

  describe('moderateProject', () => {
    it('should moderate project title and description', async () => {
      // Arrange
      const mockProject = {
        _id: 'proj123',
        title: 'Hate-filled Project Title',
        description: 'This project contains violence and threats'
      };

      // Act
      const result = await contentModerationService.moderateProject(mockProject);

      // Assert
      expect(result.projectId).toBe('proj123');
      expect(result.isApproved).toBe(false);
      expect(result.issues).toHaveLength(2); // One for title, one for description
      
      const titleIssue = result.issues.find(issue => issue.field === 'title');
      const descIssue = result.issues.find(issue => issue.field === 'description');
      
      expect(titleIssue).toBeDefined();
      expect(descIssue).toBeDefined();
      expect(titleIssue?.flaggedWords).toContain('hate');
      expect(descIssue?.flaggedWords).toContain('violence');
    });

    it('should approve project with appropriate content', async () => {
      // Arrange
      const mockProject = {
        _id: 'proj123',
        title: 'Website Development Project',
        description: 'Looking for a developer to create a responsive website.'
      };

      // Act
      const result = await contentModerationService.moderateProject(mockProject);

      // Assert
      expect(result.projectId).toBe('proj123');
      expect(result.isApproved).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.message).toBe('Project content approved');
    });
  });

  describe('moderateMilestone', () => {
    it('should moderate milestone content', async () => {
      // Arrange
      const mockMilestone = {
        _id: 'mile123',
        title: 'Spam Milestone',
        description: 'Abusive content here',
        acceptanceCriteria: 'Harassment criteria'
      };

      // Act
      const result = await contentModerationService.moderateMilestone(mockMilestone);

      // Assert
      expect(result.milestoneId).toBe('mile123');
      expect(result.isApproved).toBe(false);
      expect(result.issues).toHaveLength(3); // One for each field
      
      const titleIssue = result.issues.find(issue => issue.field === 'title');
      const descIssue = result.issues.find(issue => issue.field === 'description');
      const criteriaIssue = result.issues.find(issue => issue.field === 'acceptanceCriteria');
      
      expect(titleIssue).toBeDefined();
      expect(descIssue).toBeDefined();
      expect(criteriaIssue).toBeDefined();
    });

    it('should approve milestone with appropriate content', async () => {
      // Arrange
      const mockMilestone = {
        _id: 'mile123',
        title: 'Design Phase',
        description: 'Complete initial mockups and wireframes',
        acceptanceCriteria: 'Client approves designs'
      };

      // Act
      const result = await contentModerationService.moderateMilestone(mockMilestone);

      // Assert
      expect(result.milestoneId).toBe('mile123');
      expect(result.isApproved).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.message).toBe('Milestone content approved');
    });
  });

  describe('moderateDispute', () => {
    it('should moderate dispute reason', async () => {
      // Arrange
      const mockDispute = {
        _id: 'disp123',
        reason: 'Violent and threatening behavior',
        evidence: []
      };

      // Act
      const result = await contentModerationService.moderateDispute(mockDispute);

      // Assert
      expect(result.disputeId).toBe('disp123');
      expect(result.isApproved).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].field).toBe('reason');
      expect(result.issues[0].flaggedWords).toContain('violence');
    });

    it('should moderate evidence descriptions', async () => {
      // Arrange
      const mockDispute = {
        _id: 'disp123',
        reason: 'Normal dispute reason',
        evidence: [
          { description: 'File containing harassment' },
          { description: 'Appropriate evidence' }
        ]
      };

      // Act
      const result = await contentModerationService.moderateDispute(mockDispute);

      // Assert
      expect(result.disputeId).toBe('disp123');
      expect(result.isApproved).toBe(false);
      expect(result.issues).toHaveLength(1); // Only the inappropriate evidence description
      expect(result.issues[0].field).toBe('evidence[0].description');
      expect(result.issues[0].flaggedWords).toContain('harassment');
    });

    it('should approve dispute with appropriate content', async () => {
      // Arrange
      const mockDispute = {
        _id: 'disp123',
        reason: 'Quality issues with delivered work',
        evidence: [
          { description: 'Screenshot showing issues' }
        ]
      };

      // Act
      const result = await contentModerationService.moderateDispute(mockDispute);

      // Assert
      expect(result.disputeId).toBe('disp123');
      expect(result.isApproved).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.message).toBe('Dispute content approved');
    });
  });

  describe('moderateMessage', () => {
    it('should moderate message content', async () => {
      // Arrange
      const mockMessage = {
        _id: 'msg123',
        content: 'Threatening and abusive language'
      };

      // Act
      const result = await contentModerationService.moderateMessage(mockMessage);

      // Assert
      expect(result.messageId).toBe('msg123');
      expect(result.isFlagged).toBe(true);
      expect(result.flaggedWords).toContain('abuse');
    });

    it('should pass appropriate message content', async () => {
      // Arrange
      const mockMessage = {
        _id: 'msg123',
        content: 'Hi, thanks for the work so far. Please review the attached files.'
      };

      // Act
      const result = await contentModerationService.moderateMessage(mockMessage);

      // Assert
      expect(result.messageId).toBe('msg123');
      expect(result.isFlagged).toBe(false);
      expect(result.message).toBe('Message content approved');
    });
  });

  describe('moderateFile', () => {
    it('should flag restricted file types', async () => {
      // Arrange
      const filePath = '/uploads/test.exe';
      const fileName = 'test.exe';

      // Act
      const result = await contentModerationService.moderateFile(filePath, fileName);

      // Assert
      expect(result.isFlagged).toBe(true);
      expect(result.flaggedReason).toBe('File type not allowed');
    });

    it('should allow approved file types', async () => {
      // Arrange
      const filePath = '/uploads/test.pdf';
      const fileName = 'test.pdf';

      // Act
      const result = await contentModerationService.moderateFile(filePath, fileName);

      // Assert
      expect(result.isFlagged).toBe(false);
      expect(result.flaggedReason).toBeNull();
    });

    it('should handle different file extensions properly', async () => {
      // Test multiple valid extensions
      const validFiles = [
        'image.jpg',
        'document.pdf',
        'archive.zip',
        'script.js.docx'
      ];

      for (const fileName of validFiles) {
        const result = await contentModerationService.moderateFile(`/uploads/${fileName}`, fileName);
        expect(result.isFlagged).toBe(false);
      }

      // Test multiple invalid extensions
      const invalidFiles = [
        'malware.exe',
        'trojan.bat',
        'virus.dll'
      ];

      for (const fileName of invalidFiles) {
        const result = await contentModerationService.moderateFile(`/uploads/${fileName}`, fileName);
        expect(result.isFlagged).toBe(true);
      }
    });
  });

  describe('moderateProjectCompletely', () => {
    it('should moderate entire project with all components', async () => {
      // Arrange
      const projectId = 'proj123';
      const mockProject = {
        _id: projectId,
        title: 'Normal Project',
        description: 'Normal project description'
      };
      
      const mockMilestones = [
        { _id: 'mile1', title: 'Normal Milestone', description: 'Normal milestone', acceptanceCriteria: 'Normal criteria' }
      ];
      
      const mockDisputes = [
        { _id: 'disp1', reason: 'Normal dispute reason' }
      ];
      
      const mockMessages = [
        { _id: 'msg1', content: 'Normal message' }
      ];
      
      mockProjectModel.findById.mockResolvedValue(mockProject);
      mockMilestoneModel.find.mockResolvedValue(mockMilestones);
      mockDisputeModel.find.mockResolvedValue(mockDisputes);
      mockMessageModel.find.mockResolvedValue(mockMessages);

      // Act
      const result = await contentModerationService.moderateProjectCompletely(projectId);

      // Assert
      expect(result.project.isApproved).toBe(true);
      expect(result.milestones).toHaveLength(1);
      expect(result.disputes).toHaveLength(1);
      expect(result.messages).toHaveLength(1);
      expect(result.overall.isClean).toBe(true);
      expect(result.overall.totalItems).toBeGreaterThan(0);
    });

    it('should detect issues when project has flagged content', async () => {
      // Arrange
      const projectId = 'proj123';
      const mockProject = {
        _id: projectId,
        title: 'Hate-filled Project',
        description: 'Normal project description'
      };
      
      const mockMilestones = [
        { _id: 'mile1', title: 'Normal Milestone', description: 'Normal milestone', acceptanceCriteria: 'Normal criteria' }
      ];
      
      mockProjectModel.findById.mockResolvedValue(mockProject);
      mockMilestoneModel.find.mockResolvedValue(mockMilestones);
      mockDisputeModel.find.mockResolvedValue([]);
      mockMessageModel.find.mockResolvedValue([]);

      // Act
      const result = await contentModerationService.moderateProjectCompletely(projectId);

      // Assert
      expect(result.project.isApproved).toBe(false);
      expect(result.overall.flaggedItems).toBeGreaterThan(0);
      expect(result.overall.isClean).toBe(false);
    });
  });
});