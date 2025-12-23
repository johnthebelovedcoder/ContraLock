import { create } from 'zustand';
import { Project, Milestone, ProjectActivity, ChangeProposal } from '@/types';
import { projectService } from '../api';

// Define ProjectInvitation type if not defined elsewhere
interface ProjectInvitation {
  id: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  clientEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
  token: string;
  acceptedAt?: string;
  declinedAt?: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  milestones: Milestone[];
  activities: ProjectActivity[];
  invitations: ProjectInvitation[];
  changeProposals: ChangeProposal[];
  loading: boolean;
  error: string | null;

  // Project actions
  fetchProjects: (userId: string) => Promise<void>;
  fetchProject: (projectId: string) => Promise<void>;
  createProject: (projectData: any) => Promise<Project>;
  updateProject: (projectId: string, data: any) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  inviteFreelancer: (projectId: string, email: string) => Promise<void>;

  // Project Invitation actions
  fetchInvitations: (freelancerId: string) => Promise<void>;
  acceptInvitation: (token: string) => Promise<Project>;
  declineInvitation: (token: string) => Promise<void>;

  // Milestone actions
  fetchMilestones: (projectId: string) => Promise<void>;
  createMilestone: (milestoneData: any) => Promise<void>;
  updateMilestone: (milestoneId: string, data: any) => Promise<void>;
  startMilestone: (milestoneId: string) => Promise<void>;
  submitMilestone: (milestoneId: string, submissionData: any) => Promise<void>;
  approveMilestone: (milestoneId: string, feedback?: string) => Promise<void>;
  requestRevision: (milestoneId: string, revisionNotes: string) => Promise<void>;
  disputeMilestone: (milestoneId: string, disputeData: any) => Promise<void>;

  // Activity actions
  fetchActivities: (projectId: string) => Promise<void>;

  // Payment actions
  releasePayment: (milestoneId: string) => Promise<void>;

  // Change proposal actions
  fetchChangeProposals: (projectId: string) => Promise<void>;
  createChangeProposal: (proposalData: any) => Promise<ChangeProposal>;
  updateChangeProposal: (proposalId: string, data: any) => Promise<ChangeProposal>;
  approveChangeProposal: (proposalId: string) => Promise<ChangeProposal>;
  rejectChangeProposal: (proposalId: string) => Promise<ChangeProposal>;

  // Demo data initialization
  initializeDemoData: () => void;

  clearError: () => void;
}

// Additional milestone-specific functionality if needed
export const useMilestoneStore = () => {
  const { milestones, fetchMilestones, createMilestone, updateMilestone, startMilestone, submitMilestone, approveMilestone, requestRevision, disputeMilestone } = useProjectStore();
  return {
    milestones,
    fetchMilestones,
    createMilestone,
    updateMilestone,
    startMilestone,
    submitMilestone,
    approveMilestone,
    requestRevision,
    disputeMilestone
  };
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  milestones: [],
  activities: [],
  invitations: [],
  changeProposals: [],
  loading: false,
  error: null,

  fetchProjects: async (userId) => {
    set({ loading: true });
    try {
      const response = await projectService.getProjects(userId, {}, { page: 1, limit: 20 });
      set({ projects: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch projects', loading: false });
      throw error;
    }
  },

  fetchProject: async (projectId) => {
    set({ loading: true });
    try {
      const project = await projectService.getProjectById(projectId);
      set({ currentProject: project, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch project', loading: false });
      throw error;
    }
  },

  createProject: async (projectData) => {
    set({ loading: true });
    try {
      const newProject = await projectService.createProject(projectData);

      set((state) => ({
        projects: [...state.projects, newProject],
        loading: false,
      }));

      return newProject;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create project', loading: false });
      throw error;
    }
  },

  // Function to enable/disable project sharing
  toggleProjectSharing: (projectId: string, enabled: boolean) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? { ...project, sharingEnabled: enabled }
          : project
      )
    }));
  },

  // Function to update project status and disable sharing on acceptance
  updateProjectStatus: (projectId: string, status: string) => {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              status,
              // Disable sharing if project is accepted/active
              sharingEnabled: !['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)
            }
          : project
      )
    }));
  },

  updateProject: async (projectId, data) => {
    set({ loading: true });
    try {
      const updatedProject = await projectService.updateProject(projectId, data);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? updatedProject : p)),
        currentProject: state.currentProject?.id === projectId ? updatedProject : state.currentProject,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update project', loading: false });
      throw error;
    }
  },

  deleteProject: async (projectId) => {
    set({ loading: true });
    try {
      await projectService.deleteProject(projectId);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete project', loading: false });
      throw error;
    }
  },

  inviteFreelancer: async (projectId, email) => {
    try {
      await projectService.inviteFreelancer(projectId, email);
      // Update the project in state if needed
      const project = await projectService.getProjectById(projectId);
      set((state) => ({
        currentProject: project,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to invite freelancer' });
      throw error;
    }
  },

  fetchMilestones: async (projectId) => {
    set({ loading: true });
    try {
      const milestones = await projectService.getMilestones(projectId);
      set({
        milestones,
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch milestones', loading: false });
      throw error;
    }
  },

  createMilestone: async (milestoneData) => {
    set({ loading: true });
    try {
      const newMilestone = await projectService.createMilestone(milestoneData);
      set((state) => ({
        milestones: [...state.milestones, newMilestone],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to create milestone', loading: false });
      throw error;
    }
  },

  updateMilestone: async (milestoneId, data) => {
    set({ loading: true });
    try {
      const updatedMilestone = await projectService.updateMilestone(milestoneId, data);
      set((state) => ({
        milestones: state.milestones.map((m) => (m.id === milestoneId ? updatedMilestone : m)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update milestone', loading: false });
      throw error;
    }
  },

  startMilestone: async (milestoneId) => {
    try {
      const updatedMilestone = await projectService.startMilestone(milestoneId);
      set((state) => ({
        milestones: state.milestones.map((m) => (m.id === milestoneId ? updatedMilestone : m)),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to start milestone' });
      throw error;
    }
  },

  submitMilestone: async (milestoneId, submissionData) => {
    set({ loading: true });
    try {
      const updatedMilestone = await projectService.submitMilestone(milestoneId, submissionData);
      set((state) => ({
        milestones: state.milestones.map(m =>
          m.id === milestoneId ? updatedMilestone : m
        ),
        loading: false,
      }));
      return updatedMilestone;
    } catch (error: any) {
      set({ error: error.message || 'Failed to submit milestone', loading: false });
      throw error;
    }
  },

  approveMilestone: async (milestoneId, feedback) => {
    try {
      const updatedMilestone = await projectService.approveMilestone(milestoneId, feedback);
      set((state) => ({
        milestones: state.milestones.map((m) => (m.id === milestoneId ? updatedMilestone : m)),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to approve milestone' });
      throw error;
    }
  },

  requestRevision: async (milestoneId, revisionNotes) => {
    try {
      const updatedMilestone = await projectService.requestRevision(milestoneId, revisionNotes);
      set((state) => ({
        milestones: state.milestones.map((m) => (m.id === milestoneId ? updatedMilestone : m)),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to request revision' });
      throw error;
    }
  },

  disputeMilestone: async (milestoneId, disputeData) => {
    try {
      const updatedMilestone = await projectService.disputeMilestone(milestoneId, disputeData);
      set((state) => ({
        milestones: state.milestones.map((m) => (m.id === milestoneId ? updatedMilestone : m)),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to dispute milestone' });
      throw error;
    }
  },

  fetchActivities: async (projectId) => {
    try {
      const response = await projectService.getProjectActivities(projectId, { page: 1, limit: 50 });
      set({ activities: response.data });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch activities' });
      throw error;
    }
  },

  fetchInvitations: async (freelancerId) => {
    set({ loading: true });
    try {
      // Use the project service to fetch invitations (assuming there's an endpoint for this)
      // If there isn't a specific endpoint, we might need to update the service
      // For now I'll assume we need to fetch projects and filter for invitations
      // This might need to be updated based on actual API endpoints available
      const response = await projectService.getInvitationsForFreelancer(freelancerId);
      set({
        invitations: response,
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch invitations', loading: false });
      throw error;
    }
  },

  acceptInvitation: async (token) => {
    set({ loading: true });
    try {
      const project = await projectService.acceptInvitation(token);
      set((state) => ({
        projects: [
          ...state.projects.filter(p => p.id !== project.id),
          project
        ],
        invitations: state.invitations.map(inv =>
          inv.token === token ? { ...inv, status: 'ACCEPTED', acceptedAt: new Date().toISOString() } : inv
        ),
        loading: false,
      }));
      return project;
    } catch (error: any) {
      set({ error: error.message || 'Failed to accept invitation', loading: false });
      throw error;
    }
  },

  declineInvitation: async (token) => {
    set({ loading: true });
    try {
      // In a real app, this would call the backend
      // For the mock implementation, update the invitation status
      set((state) => ({
        invitations: state.invitations.map(inv =>
          inv.token === token ? { ...inv, status: 'DECLINED', declinedAt: new Date().toISOString() } : inv
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to decline invitation', loading: false });
      throw error;
    }
  },


  releasePayment: async (milestoneId) => {
    set({ loading: true });
    try {
      // This would require a payment service call - let's see if it exists
      // For now, I'll call a payment service method that might need to be created
      // We assume there's a payment service that handles releasing payments
      const updatedMilestone = await projectService.updateMilestone(milestoneId, { status: 'PAID' });

      set((state) => ({
        milestones: state.milestones.map(m =>
          m.id === milestoneId ? updatedMilestone : m
        ),
        loading: false,
      }));

      return updatedMilestone;
    } catch (error: any) {
      set({ error: error.message || 'Failed to release payment', loading: false });
      throw error;
    }
  },

  fetchChangeProposals: async (projectId) => {
    set({ loading: true });
    try {
      // Assuming there's an API endpoint for change proposals
      // This might need to be implemented in the service if it doesn't exist
      // For now, I'll just return empty array as this endpoint may not be implemented yet
      // We'll need to implement this properly based on actual API implementation
      set({ changeProposals: [], loading: false });
      return [];
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch change proposals', loading: false });
      throw error;
    }
  },

  createChangeProposal: async (proposalData) => {
    set({ loading: true });
    try {
      // Mock implementation: create a new change proposal
      const newProposal: ChangeProposal = {
        id: `proposal-${Date.now()}`,
        projectId: proposalData.projectId,
        milestoneId: proposalData.milestoneId,
        proposer: proposalData.proposer || 'freelancer',
        status: 'PENDING',
        originalValues: proposalData.originalValues || {},
        proposedValues: proposalData.proposedValues || {},
        reason: proposalData.reason || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set((state) => ({
        changeProposals: [...state.changeProposals, newProposal],
        loading: false,
      }));
      return newProposal;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create change proposal', loading: false });
      throw error;
    }
  },

  updateChangeProposal: async (proposalId, data) => {
    set({ loading: true });
    try {
      set((state) => {
        const updatedProposals = state.changeProposals.map(cp =>
          cp.id === proposalId
            ? {
                ...cp,
                ...data,
                updatedAt: new Date(),
              }
            : cp
        );
        return {
          changeProposals: updatedProposals,
          loading: false,
        };
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update change proposal', loading: false });
      throw error;
    }
  },

  approveChangeProposal: async (proposalId) => {
    set({ loading: true });
    try {
      set((state) => {
        // Find the proposal to approve
        const proposalToApprove = state.changeProposals.find(cp => cp.id === proposalId);
        if (!proposalToApprove) {
          throw new Error('Change proposal not found');
        }

        // Update the proposal status
        const updatedProposals = state.changeProposals.map(cp =>
          cp.id === proposalId
            ? {
                ...cp,
                status: 'APPROVED',
                resolvedAt: new Date(),
                updatedAt: new Date(),
              }
            : cp
        );

        // Update the corresponding milestone with the proposed values
        let updatedMilestones = state.milestones;
        if (proposalToApprove.milestoneId) {
          updatedMilestones = state.milestones.map(m =>
            m.id === proposalToApprove.milestoneId
              ? {
                  ...m,
                  ...(proposalToApprove.proposedValues.title && { title: proposalToApprove.proposedValues.title }),
                  ...(proposalToApprove.proposedValues.description && { description: proposalToApprove.proposedValues.description }),
                  ...(proposalToApprove.proposedValues.deadline && { deadline: proposalToApprove.proposedValues.deadline }),
                  ...(proposalToApprove.proposedValues.amount && { amount: proposalToApprove.proposedValues.amount }),
                  updatedAt: new Date(),
                }
              : m
          );
        }

        return {
          changeProposals: updatedProposals,
          milestones: updatedMilestones,
          loading: false,
        };
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to approve change proposal', loading: false });
      throw error;
    }
  },

  rejectChangeProposal: async (proposalId) => {
    set({ loading: true });
    try {
      set((state) => {
        const updatedProposals = state.changeProposals.map(cp =>
          cp.id === proposalId
            ? {
                ...cp,
                status: 'REJECTED',
                resolvedAt: new Date(),
                updatedAt: new Date(),
              }
            : cp
        );
        return {
          changeProposals: updatedProposals,
          loading: false,
        };
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to reject change proposal', loading: false });
      throw error;
    }
  },

  initializeDemoData: () => {
    // Generate mock data for demonstration purposes
    const mockProjects: Project[] = [
      {
        id: 'proj-1',
        title: 'Website Redesign',
        description: 'Complete redesign of company website with modern UI',
        category: 'Web Development',
        totalBudget: 5000,
        totalBudgetInUsd: 5000,
        timeline: '30 days',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        clientId: 'client-1',
        freelancerId: 'freelancer-1',
        escrowAmount: 5000,
        escrowAmountInUsd: 5000,
        escrowStatus: 'HELD',
        platformFee: 250,
        platformFeeInUsd: 250,
        paymentProcessingFee: 50,
        paymentProcessingFeeInUsd: 50,
        currency: 'USD',
        exchangeRate: 1,
        exchangeRateTimestamp: new Date(),
        autoApprovalPeriod: 7,
        maxRevisionsPerMilestone: 2,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        id: 'proj-2',
        title: 'Mobile App Development',
        description: 'iOS and Android app for task management',
        category: 'Mobile Development',
        totalBudget: 12000,
        totalBudgetInUsd: 12000,
        timeline: '60 days',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        clientId: 'client-1',
        freelancerId: 'freelancer-2',
        escrowAmount: 12000,
        escrowAmountInUsd: 12000,
        escrowStatus: 'HELD',
        platformFee: 600,
        platformFeeInUsd: 600,
        paymentProcessingFee: 120,
        paymentProcessingFeeInUsd: 120,
        currency: 'USD',
        exchangeRate: 1,
        exchangeRateTimestamp: new Date(),
        autoApprovalPeriod: 7,
        maxRevisionsPerMilestone: 2,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        id: 'proj-3',
        title: 'E-commerce Platform',
        description: 'Custom e-commerce solution with payment integration',
        category: 'Web Development',
        totalBudget: 8500,
        totalBudgetInUsd: 8500,
        timeline: '45 days',
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: 'PENDING_ACCEPTANCE',
        clientId: 'client-1',
        escrowStatus: 'NOT_DEPOSITED',
        platformFee: 425,
        platformFeeInUsd: 425,
        paymentProcessingFee: 85,
        paymentProcessingFeeInUsd: 85,
        currency: 'USD',
        exchangeRate: 1,
        exchangeRateTimestamp: new Date(),
        autoApprovalPeriod: 7,
        maxRevisionsPerMilestone: 2,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];

    const mockMilestones: Milestone[] = [
      {
        id: 'ms-1',
        projectId: 'proj-1',
        title: 'Design Phase',
        description: 'Complete wireframes and mockups for all pages',
        amount: 1500,
        currency: 'USD',
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        acceptanceCriteria: 'All pages designed with responsive layouts',
        status: 'APPROVED',
        order: 1,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        submissionNotes: 'All design assets delivered in Figma'
      },
      {
        id: 'ms-2',
        projectId: 'proj-1',
        title: 'Frontend Development',
        description: 'Implement responsive UI components',
        amount: 2000,
        currency: 'USD',
        deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        acceptanceCriteria: 'All components implemented and tested',
        status: 'APPROVED',
        order: 2,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        submissionNotes: 'All components completed and tested across devices'
      },
      {
        id: 'ms-3',
        projectId: 'proj-1',
        title: 'Backend Integration',
        description: 'Connect frontend to backend services',
        amount: 1500,
        currency: 'USD',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        acceptanceCriteria: 'All APIs connected and data flowing correctly',
        status: 'SUBMITTED',
        order: 3,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        submissionNotes: 'All backend endpoints connected and tested successfully'
      },
      {
        id: 'ms-4',
        projectId: 'proj-2',
        title: 'App Architecture',
        description: 'Set up project structure and core architecture',
        amount: 3000,
        currency: 'USD',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        acceptanceCriteria: 'Clean architecture implemented with proper layer separation',
        status: 'IN_PROGRESS',
        order: 1,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'ms-5',
        projectId: 'proj-2',
        title: 'UI Implementation',
        description: 'Implement core UI screens',
        amount: 4000,
        currency: 'USD',
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        acceptanceCriteria: 'All main screens implemented with proper navigation',
        status: 'PENDING',
        order: 2,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'ms-6',
        projectId: 'proj-2',
        title: 'Testing & QA',
        description: 'Comprehensive testing and quality assurance',
        amount: 2500,
        currency: 'USD',
        deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
        acceptanceCriteria: 'All tests passing and app ready for deployment',
        status: 'PENDING',
        order: 3,
        createdAt: new Date(Date.now()),
        updatedAt: new Date(Date.now())
      },
      {
        id: 'ms-7',
        projectId: 'proj-3',
        title: 'Requirements Analysis',
        description: 'Analyze business requirements and technical specifications',
        amount: 1200,
        currency: 'USD',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        acceptanceCriteria: 'Complete requirements document approved by client',
        status: 'REVISION_REQUESTED',
        order: 1,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        revisionNotes: 'Need to clarify payment gateway requirements'
      },
      {
        id: 'ms-8',
        projectId: 'proj-3',
        title: 'Database Design',
        description: 'Design and implement database schema',
        amount: 1800,
        currency: 'USD',
        deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        acceptanceCriteria: 'Database schema designed and documented',
        status: 'PENDING',
        order: 2,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];

    const mockActivities: ProjectActivity[] = [
      {
        id: 'act-1',
        projectId: 'proj-1',
        userId: 'freelancer-1',
        actorRole: 'freelancer',
        action: 'MILESTONE_STARTED',
        details: { milestoneId: 'ms-1', milestoneTitle: 'Design Phase' },
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'act-2',
        projectId: 'proj-1',
        userId: 'freelancer-1',
        actorRole: 'freelancer',
        action: 'MILESTONE_SUBMITTED',
        details: { milestoneId: 'ms-1', milestoneTitle: 'Design Phase' },
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'act-3',
        projectId: 'proj-1',
        userId: 'client-1',
        actorRole: 'client',
        action: 'MILESTONE_APPROVED',
        details: { milestoneId: 'ms-1', milestoneTitle: 'Design Phase' },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'act-4',
        projectId: 'proj-2',
        userId: 'freelancer-2',
        actorRole: 'freelancer',
        action: 'PROJECT_ACCEPTED',
        details: { projectId: 'proj-2', projectName: 'Mobile App Development' },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ];

    // Mock invitation data for freelancer
    const mockInvitations: ProjectInvitation[] = [
      {
        id: 'inv-1',
        projectId: 'proj-4',
        projectTitle: 'Logo Design Project',
        clientName: 'Acme Inc',
        clientEmail: 'contact@acme.com',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        token: 'token-12345',
      },
      {
        id: 'inv-2',
        projectId: 'proj-5',
        projectTitle: 'Brand Identity Package',
        clientName: 'Tech Startup Co',
        clientEmail: 'hello@techstartup.co',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        token: 'token-67890',
      },
      {
        id: 'inv-3',
        projectId: 'proj-6',
        projectTitle: 'Landing Page Development',
        clientName: 'Marketing Firm',
        clientEmail: 'projects@marketingfirm.com',
        status: 'ACCEPTED',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Expired
        acceptedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        token: 'token-abcde',
      },
      {
        id: 'inv-4',
        projectId: 'proj-7',
        projectTitle: 'SEO Optimization',
        clientName: 'E-commerce Store',
        clientEmail: 'admin@ecommercestore.com',
        status: 'DECLINED',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Expired
        declinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        token: 'token-fghij',
      },
      {
        id: 'inv-5',
        projectId: 'proj-8',
        projectTitle: 'Social Media Strategy',
        clientName: 'Consulting Group',
        clientEmail: 'info@consultinggroup.com',
        status: 'EXPIRED',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Expired
        token: 'token-klmno',
      },
      {
        id: 'inv-6',
        projectId: 'proj-9',
        projectTitle: 'Content Writing Package',
        clientName: 'Blog Network',
        clientEmail: 'editor@blognetwork.com',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        token: 'token-pqrst',
      }
    ];

    set({
      projects: mockProjects,
      milestones: mockMilestones,
      activities: mockActivities,
      invitations: mockInvitations,
      loading: false
    });
  },

  clearError: () => set({ error: null }),
}));