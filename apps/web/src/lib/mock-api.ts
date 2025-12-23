// Mock API service for Delivault platform
// Returns mock data for all API endpoints

import { User, Project, Milestone, Transaction, Invoice, EscrowAccount, Dispute, Notification } from '@/types';
import {
  getMockUsers,
  getMockProjects,
  getMockMilestones,
  getMockTransactions,
  getMockInvoices,
  getMockEscrowAccounts,
  getMockDisputes,
  getMockNotifications,
  generateMockProject,
  generateMockMilestone,
  generateMockTransaction
} from './mock-data';

// Simulate API delay
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Mock authentication service
export const mockAuthService = {
  async login(email: string, password: string): Promise<User | null> {
    await mockDelay();
    const user = getMockUsers().find(u => u.email === email);
    if (user && password) { // Simplified validation
      return user;
    }
    return null;
  },

  async register(userData: any): Promise<User> {
    await mockDelay();
    // In a real app, this would create a new user
    return {
      id: `user-${Date.now()}`,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'client',
      status: 'unverified',
      profile: { bio: '', completed: false },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async logout(): Promise<boolean> {
    await mockDelay();
    return true;
  },

  async getProfile(): Promise<User | null> {
    await mockDelay();
    return getMockUsers()[0]; // Return first user as mock profile
  }
};

// Mock project service
export const mockProjectService = {
  async getProjects(userId: string, filters?: any): Promise<{ items: Project[], total: number, page: number, limit: number }> {
    await mockDelay();
    let projects = getMockProjects();
    
    // Apply filters
    if (filters?.role) {
      if (filters.role === 'client') {
        projects = projects.filter(p => p.clientId === userId);
      } else if (filters.role === 'freelancer') {
        projects = projects.filter(p => p.freelancerId === userId);
      }
    }
    
    if (filters?.status) {
      projects = projects.filter(p => p.status === filters.status);
    }
    
    return {
      items: projects,
      total: projects.length,
      page: 1,
      limit: 10
    };
  },

  async getProjectById(projectId: string): Promise<Project | null> {
    await mockDelay();
    return getMockProjects().find(p => p.id === projectId) || null;
  },

  async createProject(projectData: Partial<Project>): Promise<Project> {
    await mockDelay();
    return generateMockProject({
      ...projectData,
      id: `proj-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },

  async updateProject(projectId: string, projectData: Partial<Project>): Promise<Project> {
    await mockDelay();
    // In a real app, this would update the existing project
    return generateMockProject({
      ...projectData,
      id: projectId,
      updatedAt: new Date(),
    });
  },

  async deleteProject(projectId: string): Promise<boolean> {
    await mockDelay();
    // In a real app, this would delete the project
    return true;
  }
};

// Mock milestone service
export const mockMilestoneService = {
  async getMilestones(projectId: string): Promise<Milestone[]> {
    await mockDelay();
    return getMockMilestones().filter(m => m.projectId === projectId);
  },

  async getMilestoneById(milestoneId: string): Promise<Milestone | null> {
    await mockDelay();
    return getMockMilestones().find(m => m.id === milestoneId) || null;
  },

  async createMilestone(milestoneData: Partial<Milestone>): Promise<Milestone> {
    await mockDelay();
    return generateMockMilestone({
      ...milestoneData,
      id: `ms-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },

  async updateMilestone(milestoneId: string, milestoneData: Partial<Milestone>): Promise<Milestone> {
    await mockDelay();
    // In a real app, this would update the existing milestone
    return generateMockMilestone({
      ...milestoneData,
      id: milestoneId,
      updatedAt: new Date(),
    });
  },

  async submitMilestone(milestoneId: string): Promise<Milestone> {
    await mockDelay();
    const milestone = getMockMilestones().find(m => m.id === milestoneId);
    if (milestone) {
      return {
        ...milestone,
        status: 'SUBMITTED',
        updatedAt: new Date()
      };
    }
    throw new Error('Milestone not found');
  },

  async approveMilestone(milestoneId: string): Promise<Milestone> {
    await mockDelay();
    const milestone = getMockMilestones().find(m => m.id === milestoneId);
    if (milestone) {
      return {
        ...milestone,
        status: 'APPROVED',
        updatedAt: new Date()
      };
    }
    throw new Error('Milestone not found');
  }
};

// Mock payment service
export const mockPaymentService = {
  async getEscrowAccount(projectId: string): Promise<EscrowAccount | null> {
    await mockDelay();
    return getMockEscrowAccounts().find(e => e.projectId === projectId) || null;
  },

  async depositFunds(depositData: any): Promise<EscrowAccount> {
    await mockDelay();
    // In a real app, this would process the deposit
    const project = getMockProjects().find(p => p.id === depositData.projectId);
    if (!project) throw new Error('Project not found');
    
    return {
      id: `escrow-${Date.now()}`,
      projectId: depositData.projectId,
      clientId: project.clientId,
      freelancerId: project.freelancerId || '',
      totalAmount: depositData.amount,
      heldAmount: depositData.amount,
      releasedAmount: 0,
      status: 'HELD',
      platformFee: Math.round(depositData.amount * 0.019), // 1.9% client fee
      paymentProcessingFee: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },

  async getTransactions(userId: string, filters?: any): Promise<Transaction[]> {
    await mockDelay();
    let transactions = getMockTransactions();
    
    if (filters?.projectId) {
      transactions = transactions.filter(t => t.projectId === filters.projectId);
    }
    
    // Filter by user (either from or to)
    transactions = transactions.filter(t => t.fromUserId === userId || t.toUserId === userId);
    
    return transactions;
  },

  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    await mockDelay();
    return getMockTransactions().find(t => t.id === transactionId) || null;
  },

  async getUserBalance(userId: string): Promise<{ availableBalance: number, pendingBalance: number, totalBalance: number }> {
    await mockDelay();
    // Mock balance calculation based on transactions
    const transactions = getMockTransactions().filter(t => t.toUserId === userId);
    const totalReceived = transactions
      .filter(t => t.status === 'COMPLETED' && (t.type === 'RELEASE' || t.type === 'REFUND'))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const pendingTransactions = getMockTransactions().filter(t => 
      t.toUserId === userId && t.status === 'PENDING'
    );
    const pendingAmount = pendingTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      availableBalance: totalReceived,
      pendingBalance: pendingAmount,
      totalBalance: totalReceived + pendingAmount
    };
  },

  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    await mockDelay();
    return getMockInvoices().find(i => i.id === invoiceId) || null;
  }
};

// Mock dispute service
export const mockDisputeService = {
  async getDisputes(userId: string, filters?: any): Promise<Dispute[]> {
    await mockDelay();
    let disputes = getMockDisputes();
    
    // Filter by user involvement
    disputes = disputes.filter(d => d.clientId === userId || d.freelancerId === userId);
    
    if (filters?.status) {
      disputes = disputes.filter(d => d.status === filters.status);
    }
    
    return disputes;
  },

  async getDisputeById(disputeId: string): Promise<Dispute | null> {
    await mockDelay();
    return getMockDisputes().find(d => d.id === disputeId) || null;
  },

  async createDispute(disputeData: Partial<Dispute>): Promise<Dispute> {
    await mockDelay();
    // In a real app, this would create a new dispute
    return {
      id: `disp-${Date.now()}`,
      ...disputeData,
      status: 'PENDING',
      resolution: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Dispute;
  },

  async resolveDispute(disputeId: string, resolutionData: any): Promise<Dispute> {
    await mockDelay();
    const dispute = getMockDisputes().find(d => d.id === disputeId);
    if (!dispute) throw new Error('Dispute not found');
    
    return {
      ...dispute,
      status: 'RESOLVED',
      resolution: {
        ...resolutionData,
        resolvedAt: new Date()
      },
      updatedAt: new Date()
    };
  }
};

// Mock notification service
export const mockNotificationService = {
  async getNotifications(userId: string): Promise<Notification[]> {
    await mockDelay();
    return getMockNotifications().filter(n => n.userId === userId);
  },

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    await mockDelay();
    const notification = getMockNotifications().find(n => n.id === notificationId);
    if (!notification) throw new Error('Notification not found');
    
    return {
      ...notification,
      read: true,
      readAt: new Date()
    };
  },

  async markAllAsRead(userId: string): Promise<boolean> {
    await mockDelay();
    // In a real app, this would mark all user notifications as read
    return true;
  }
};

// Mock service that combines all services
export const mockApiService = {
  auth: mockAuthService,
  projects: mockProjectService,
  milestones: mockMilestoneService,
  payments: mockPaymentService,
  disputes: mockDisputeService,
  notifications: mockNotificationService,
  
  // Helper to reset all data to initial state
  reset() {
    // This would reset mock data in a real implementation
  }
};