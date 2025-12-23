import { useProjectStore } from '../store/projectStore';
import { projectService } from '../api/projectService';

// Mock the project service
jest.mock('../api/projectService', () => ({
  projectService: {
    getProjects: jest.fn(),
    getProjectById: jest.fn(),
    createProject: jest.fn(),
    updateProject: jest.fn(),
    deleteProject: jest.fn(),
    inviteFreelancer: jest.fn(),
    acceptInvitation: jest.fn(),
    getMilestones: jest.fn(),
    createMilestone: jest.fn(),
    updateMilestone: jest.fn(),
    startMilestone: jest.fn(),
    submitMilestone: jest.fn(),
    approveMilestone: jest.fn(),
    requestRevision: jest.fn(),
    disputeMilestone: jest.fn(),
    getProjectActivities: jest.fn(),
    getInvitationsForFreelancer: jest.fn(),
    searchProjects: jest.fn(),
  },
}));

describe('Project Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useProjectStore.setState({
      projects: [],
      currentProject: null,
      milestones: [],
      activities: [],
      invitations: [],
      changeProposals: [],
      loading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('should fetch projects', async () => {
    const mockProjects = [
      { id: '1', title: 'Test Project', status: 'ACTIVE' },
      { id: '2', title: 'Another Project', status: 'PENDING' },
    ];

    (projectService.getProjects as jest.Mock).mockResolvedValue({
      data: mockProjects,
    });

    const state = useProjectStore.getState();
    await state.fetchProjects('user123');

    expect(projectService.getProjects).toHaveBeenCalledWith('user123', {}, { page: 1, limit: 20 });
    expect(useProjectStore.getState().projects).toEqual(mockProjects);
    expect(useProjectStore.getState().loading).toBe(false);
  });

  it('should create a project', async () => {
    const mockProject = {
      id: 'new-project',
      title: 'New Project',
      description: 'Project description',
      status: 'PENDING_ACCEPTANCE',
    };

    (projectService.createProject as jest.Mock).mockResolvedValue(mockProject);

    const state = useProjectStore.getState();
    await state.createProject({
      title: 'New Project',
      description: 'Project description',
      category: 'Development',
      totalBudget: 5000,
      timeline: '30 days',
      deadline: new Date(),
      status: 'PENDING_ACCEPTANCE',
      milestones: [],
    });

    expect(projectService.createProject).toHaveBeenCalled();
    expect(useProjectStore.getState().projects).toContainEqual(mockProject);
    expect(useProjectStore.getState().loading).toBe(false);
  });

  it('should handle errors during project fetch', async () => {
    const errorMessage = 'Failed to fetch projects';
    (projectService.getProjects as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const state = useProjectStore.getState();
    await expect(state.fetchProjects('user123')).rejects.toThrow(errorMessage);

    expect(useProjectStore.getState().loading).toBe(false);
    expect(useProjectStore.getState().error).toBe(errorMessage);
  });

  it('should clear error', () => {
    useProjectStore.setState({ error: 'Some error' });
    expect(useProjectStore.getState().error).toBe('Some error');

    const state = useProjectStore.getState();
    state.clearError();

    expect(useProjectStore.getState().error).toBeNull();
  });
});