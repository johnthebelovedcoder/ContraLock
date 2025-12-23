import { Project, Milestone, ProjectInvitation, ProjectActivity, PaginatedResponse, FilterParams } from '@/types';
import { apiClient } from './client';

export interface CreateProjectData {
  title: string;
  description: string;
  category: string;
  totalBudget: number;
  timeline: string;
  deadline: Date;
  clientId?: string;
  freelancerId?: string;
  clientEmail?: string;
  status?: string;
  milestones: {
    title: string;
    description: string;
    amount: number;
    deadline: Date;
    acceptanceCriteria: string;
  }[];
  autoApprovalPeriod?: number;
  maxRevisionsPerMilestone?: number;
}

export interface UpdateProjectData {
  title?: string;
  description?: string;
  category?: string;
  totalBudget?: number;
  timeline?: string;
  deadline?: Date;
  status?: string;
}

export interface CreateMilestoneData {
  projectId: string;
  title: string;
  description: string;
  amount: number;
  deadline: Date;
  acceptanceCriteria: string;
  order: number;
}

class ProjectService {
  async getProjects(
    userId: string,
    filters: FilterParams,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResponse<Project>> {
    const params = new URLSearchParams({
      userId,
      ...filters,
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });

    const response = await apiClient.get(`/projects?${params.toString()}`);
    return response.data;
  }

  async getProjectById(projectId: string): Promise<Project> {
    const response = await apiClient.get(`/projects/${projectId}`);
    return response.data;
  }

  async createProject(projectData: CreateProjectData): Promise<Project> {
    const response = await apiClient.post('/projects', projectData);
    return response.data;
  }

  async updateProject(projectId: string, projectData: UpdateProjectData): Promise<Project> {
    const response = await apiClient.put(`/projects/${projectId}`, projectData);
    return response.data;
  }

  async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}`);
  }

  async archiveProject(projectId: string): Promise<Project> {
    const response = await apiClient.patch(`/projects/${projectId}/archive`);
    return response.data;
  }

  async duplicateProject(projectId: string): Promise<Project> {
    const response = await apiClient.post(`/projects/${projectId}/duplicate`);
    return response.data;
  }

  async submitCounterProposals(
    projectId: string,
    proposals: {
      milestoneId: string;
      milestoneTitle?: string;
      changes: { field: string; oldValue: any; newValue: any }[];
      reason: string;
    }[]
  ): Promise<Project> {
    const response = await apiClient.post(`/projects/${projectId}/counter-proposals`, { proposals });
    return response.data;
  }

  async inviteFreelancer(
    projectId: string,
    email: string
  ): Promise<ProjectInvitation> {
    const response = await apiClient.post(`/projects/${projectId}/invite`, { email });
    return response.data;
  }

  async acceptInvitation(token: string): Promise<Project> {
    const response = await apiClient.post('/projects/accept-invitation', { token });
    return response.data;
  }

  async declineInvitation(token: string): Promise<void> {
    await apiClient.post('/projects/decline-invitation', { token });
  }

  // Milestone operations
  async getMilestones(projectId: string): Promise<Milestone[]> {
    const response = await apiClient.get(`/projects/${projectId}/milestones`);
    return response.data;
  }

  async getMilestoneById(milestoneId: string): Promise<Milestone> {
    const response = await apiClient.get(`/milestones/${milestoneId}`);
    return response.data;
  }

  async createMilestone(milestoneData: CreateMilestoneData): Promise<Milestone> {
    const response = await apiClient.post('/milestones', milestoneData);
    return response.data;
  }

  async updateMilestone(
    milestoneId: string,
    milestoneData: Partial<Milestone>
  ): Promise<Milestone> {
    const response = await apiClient.put(`/milestones/${milestoneId}`, milestoneData);
    return response.data;
  }

  async startMilestone(milestoneId: string): Promise<Milestone> {
    const response = await apiClient.post(`/milestones/${milestoneId}/start`);
    return response.data;
  }

  async submitMilestone(
    milestoneId: string,
    submissionData: {
      deliverables: File[];
      submissionNotes?: string;
    }
  ): Promise<Milestone> {
    // If there are actual files to upload, use FormData
    if (submissionData.deliverables && submissionData.deliverables.length > 0) {
      const formData = new FormData();

      submissionData.deliverables.forEach((file, index) => {
        formData.append(`deliverables[${index}]`, file);
      });

      if (submissionData.submissionNotes) {
        formData.append('submissionNotes', submissionData.submissionNotes);
      }

      const response = await apiClient.post(`/milestones/${milestoneId}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } else {
      // If no files, send as JSON
      const response = await apiClient.post(`/milestones/${milestoneId}/submit`, {
        deliverables: [],
        submissionNotes: submissionData.submissionNotes || ''
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    }
  }

  async approveMilestone(milestoneId: string, feedback?: string): Promise<Milestone> {
    const response = await apiClient.post(`/milestones/${milestoneId}/approve`, { feedback });
    return response.data;
  }

  async requestRevision(
    milestoneId: string,
    revisionNotes: string
  ): Promise<Milestone> {
    const response = await apiClient.post(`/milestones/${milestoneId}/revision`, { revisionNotes });
    return response.data;
  }

  async disputeMilestone(
    milestoneId: string,
    disputeData: {
      title: string;
      description: string;
      evidence?: File[];
    }
  ): Promise<Milestone> {
    const formData = new FormData();
    formData.append('title', disputeData.title);
    formData.append('description', disputeData.description);
    
    disputeData.evidence?.forEach((file, index) => {
      formData.append(`evidence[${index}]`, file);
    });

    const response = await apiClient.post(`/milestones/${milestoneId}/dispute`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  // Project activities
  async getProjectActivities(
    projectId: string,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResponse<ProjectActivity>> {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });

    const response = await apiClient.get(`/projects/${projectId}/activities?${params.toString()}`);
    return response.data;
  }

  // Project invitations
  async getInvitationsForFreelancer(
    freelancerId: string
  ): Promise<ProjectInvitation[]> {
    const response = await apiClient.get(`/projects/invitations/freelancer/${freelancerId}`);
    return response.data;
  }

  // Project search and filtering
  async searchProjects(
    filters: FilterParams,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResponse<Project>> {
    const params = new URLSearchParams({
      ...filters,
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });

    const response = await apiClient.get(`/projects/search?${params.toString()}`);
    return response.data;
  }

  // Change proposal operations
  async createChangeProposal(
    proposalData: {
      projectId: string;
      milestoneId: string;
      reason: string;
      originalValues: any;
      proposedValues: any;
    }
  ): Promise<any> {
    const response = await apiClient.post('/change-proposals', proposalData);
    return response.data;
  }
}

export const projectService = new ProjectService();
export { CreateMilestoneData, CreateProjectData, UpdateProjectData };