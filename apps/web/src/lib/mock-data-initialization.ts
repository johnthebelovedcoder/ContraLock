// Mock Data Initialization Service
// Provides a way to populate the application with realistic mock data for development and testing

import {
  getMockUsers,
  getMockProjects,
  getMockMilestones,
  getMockTransactions,
  getMockInvoices,
  getMockEscrowAccounts,
  getMockDisputes,
  getMockNotifications
} from './mock-data';

export class MockDataInitializationService {
  // Store mock data in memory (in a real app, this would be stored in the backend)
  private static dataStore: {
    users: any[];
    projects: any[];
    milestones: any[];
    transactions: any[];
    invoices: any[];
    escrowAccounts: any[];
    disputes: any[];
    notifications: any[];
  } = {
    users: [],
    projects: [],
    milestones: [],
    transactions: [],
    invoices: [],
    escrowAccounts: [],
    disputes: [],
    notifications: []
  };

  // Initialize the service with mock data
  static async initialize() {
    console.log('Initializing mock data...');
    
    // Load all mock data into the data store
    this.dataStore.users = [...getMockUsers()];
    this.dataStore.projects = [...getMockProjects()];
    this.dataStore.milestones = [...getMockMilestones()];
    this.dataStore.transactions = [...getMockTransactions()];
    this.dataStore.invoices = [...getMockInvoices()];
    this.dataStore.escrowAccounts = [...getMockEscrowAccounts()];
    this.dataStore.disputes = [...getMockDisputes()];
    this.dataStore.notifications = [...getMockNotifications()];
    
    console.log(`Loaded ${this.dataStore.users.length} users`);
    console.log(`Loaded ${this.dataStore.projects.length} projects`);
    console.log(`Loaded ${this.dataStore.milestones.length} milestones`);
    console.log(`Loaded ${this.dataStore.transactions.length} transactions`);
    console.log(`Loaded ${this.dataStore.invoices.length} invoices`);
    console.log(`Loaded ${this.dataStore.escrowAccounts.length} escrow accounts`);
    console.log(`Loaded ${this.dataStore.disputes.length} disputes`);
    console.log(`Loaded ${this.dataStore.notifications.length} notifications`);
    
    console.log('Mock data initialization complete!');
  }

  // Get all mock data
  static getDataStore() {
    return { ...this.dataStore };
  }

  // Get specific data types
  static getUsers() {
    return [...this.dataStore.users];
  }

  static getProjects() {
    return [...this.dataStore.projects];
  }

  static getMilestones() {
    return [...this.dataStore.milestones];
  }

  static getTransactions() {
    return [...this.dataStore.transactions];
  }

  static getInvoices() {
    return [...this.dataStore.invoices];
  }

  static getEscrowAccounts() {
    return [...this.dataStore.escrowAccounts];
  }

  static getDisputes() {
    return [...this.dataStore.disputes];
  }

  static getNotifications() {
    return [...this.dataStore.notifications];
  }

  // Find data by ID
  static findUserById(id: string) {
    return this.dataStore.users.find((user: any) => user.id === id);
  }

  static findProjectById(id: string) {
    return this.dataStore.projects.find((project: any) => project.id === id);
  }

  static findMilestoneById(id: string) {
    return this.dataStore.milestones.find((milestone: any) => milestone.id === id);
  }

  static findTransactionById(id: string) {
    return this.dataStore.transactions.find((transaction: any) => transaction.id === id);
  }

  static findInvoiceById(id: string) {
    return this.dataStore.invoices.find((invoice: any) => invoice.id === id);
  }

  static findDisputeById(id: string) {
    return this.dataStore.disputes.find((dispute: any) => dispute.id === id);
  }

  // Create new mock data
  static createUser(userData: any) {
    const newUser = {
      id: `user-${Date.now()}`,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.dataStore.users.push(newUser);
    return newUser;
  }

  static createProject(projectData: any) {
    const newProject = {
      id: `proj-${Date.now()}`,
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.dataStore.projects.push(newProject);
    return newProject;
  }

  static createMilestone(milestoneData: any) {
    const newMilestone = {
      id: `ms-${Date.now()}`,
      ...milestoneData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.dataStore.milestones.push(newMilestone);
    return newMilestone;
  }

  static createTransaction(transactionData: any) {
    const newTransaction = {
      id: `tx-${Date.now()}`,
      ...transactionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.dataStore.transactions.push(newTransaction);
    return newTransaction;
  }

  // Update existing data
  static updateUser(id: string, updates: any) {
    const index = this.dataStore.users.findIndex((user: any) => user.id === id);
    if (index !== -1) {
      this.dataStore.users[index] = {
        ...this.dataStore.users[index],
        ...updates,
        updatedAt: new Date()
      };
      return this.dataStore.users[index];
    }
    return null;
  }

  static updateProject(id: string, updates: any) {
    const index = this.dataStore.projects.findIndex((project: any) => project.id === id);
    if (index !== -1) {
      this.dataStore.projects[index] = {
        ...this.dataStore.projects[index],
        ...updates,
        updatedAt: new Date()
      };
      return this.dataStore.projects[index];
    }
    return null;
  }

  static updateMilestone(id: string, updates: any) {
    const index = this.dataStore.milestones.findIndex((milestone: any) => milestone.id === id);
    if (index !== -1) {
      this.dataStore.milestones[index] = {
        ...this.dataStore.milestones[index],
        ...updates,
        updatedAt: new Date()
      };
      return this.dataStore.milestones[index];
    }
    return null;
  }

  // Reset to initial state
  static reset() {
    console.log('Resetting mock data...');
    this.initialize(); // Reinitialize with original mock data
  }
}

// Initialize the mock data service when this module is loaded
// In a real app, you might want to control this differently
export const initializeMockData = async () => {
  await MockDataInitializationService.initialize();
  return MockDataInitializationService;
};

// Export the service for use in development
export default MockDataInitializationService;