import { mockApiService } from './mock-api';
import { getMockProjects, getMockUsers, getMockMilestones, getMockTransactions, getMockInvoices, getMockDisputes, getMockNotifications } from './mock-data';

// Mock data provider for initializing application state
export class MockDataProvider {
  // Initialize with mock users
  static async initializeUsers() {
    // Return mock users without actually storing them
    return getMockUsers();
  }

  // Initialize with mock projects
  static async initializeProjects() {
    return getMockProjects();
  }

  // Initialize with mock milestones
  static async initializeMilestones() {
    return getMockMilestones();
  }

  // Initialize with mock transactions
  static async initializeTransactions() {
    return getMockTransactions();
  }

  // Initialize with mock invoices
  static async initializeInvoices() {
    return getMockInvoices();
  }

  // Initialize with mock disputes
  static async initializeDisputes() {
    return getMockDisputes();
  }

  // Initialize with mock notifications
  static async initializeNotifications() {
    return getMockNotifications();
  }

  // Initialize complete dashboard data for a user
  static async initializeDashboardData(userId: string, userType: 'client' | 'freelancer') {
    const projects = await this.initializeProjects();
    const transactions = await this.initializeTransactions();
    const notifications = await this.initializeNotifications();
    
    // Filter data based on user type
    let userProjects = projects;
    let userTransactions = transactions;
    let userNotifications = notifications.filter(n => n.userId === userId);
    
    if (userType === 'client') {
      userProjects = projects.filter(p => p.clientId === userId);
    } else if (userType === 'freelancer') {
      userProjects = projects.filter(p => p.freelancerId === userId);
      userTransactions = transactions.filter(t => t.toUserId === userId);
    }
    
    // Calculate metrics
    const activeProjects = userProjects.filter(p => p.status === 'ACTIVE').length;
    const completedProjects = userProjects.filter(p => p.status === 'COMPLETED').length;
    const totalBudget = userProjects.reduce((sum, p) => sum + p.totalBudget, 0);
    const unreadNotifications = userNotifications.filter(n => !n.read).length;
    
    return {
      projects: userProjects,
      transactions: userTransactions,
      notifications: userNotifications,
      metrics: {
        activeProjects,
        completedProjects,
        totalBudget,
        unreadNotifications
      }
    };
  }

  // Initialize project-specific data
  static async initializeProjectData(projectId: string) {
    const projects = await this.initializeProjects();
    const milestones = await this.initializeMilestones();
    const transactions = await this.initializeTransactions();
    const invoices = await this.initializeInvoices();
    
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const projectMilestones = milestones.filter(m => m.projectId === projectId);
    const projectTransactions = transactions.filter(t => t.projectId === projectId);
    const projectInvoices = invoices.filter(i => i.projectId === projectId);
    
    return {
      project,
      milestones: projectMilestones,
      transactions: projectTransactions,
      invoices: projectInvoices
    };
  }

  // Get user's pending actions (milestones to review, etc.)
  static async getUserPendingActions(userId: string, userType: 'client' | 'freelancer') {
    const projects = await this.initializeProjects();
    const milestones = await this.initializeMilestones();
    
    if (userType === 'client') {
      // Client needs to review submitted milestones
      const clientProjects = projects.filter(p => p.clientId === userId);
      const pendingReviews = milestones.filter(m => 
        clientProjects.some(p => p.id === m.projectId) && m.status === 'SUBMITTED'
      );
      
      return {
        pendingMilestoneReviews: pendingReviews,
        pendingProjectAcceptances: projects.filter(p => p.status === 'PENDING_ACCEPTANCE')
      };
    } else if (userType === 'freelancer') {
      // Freelancer has submitted milestones awaiting approval
      const freelancerProjects = projects.filter(p => p.freelancerId === userId);
      const pendingApprovals = milestones.filter(m => 
        freelancerProjects.some(p => p.id === m.projectId) && m.status === 'SUBMITTED'
      );
      
      return {
        pendingMilestoneApprovals: pendingApprovals,
        activeProjects: freelancerProjects.filter(p => p.status === 'ACTIVE')
      };
    }
    
    return {};
  }
}

// Convenience function to get mock data for dashboard
export const getMockDashboardData = async (userId: string, userType: 'client' | 'freelancer') => {
  return await MockDataProvider.initializeDashboardData(userId, userType);
};

// Convenience function to get mock data for a specific project
export const getMockProjectData = async (projectId: string) => {
  return await MockDataProvider.initializeProjectData(projectId);
};

// Convenience function to get mock pending actions
export const getMockPendingActions = async (userId: string, userType: 'client' | 'freelancer') => {
  return await MockDataProvider.getUserPendingActions(userId, userType);
};