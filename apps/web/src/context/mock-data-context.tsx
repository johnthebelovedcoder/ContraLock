// Mock Data Context Provider
// Provides mock data throughout the application when real API is not available

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Project, Milestone, Transaction, Invoice, EscrowAccount, Dispute, Notification } from '@/types';
import { mockApiService } from '@/lib/mock-api';
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
} from '@/lib/mock-data';

interface MockDataContextType {
  users: User[];
  projects: Project[];
  milestones: Milestone[];
  transactions: Transaction[];
  invoices: Invoice[];
  escrowAccounts: EscrowAccount[];
  disputes: Dispute[];
  notifications: Notification[];
  loading: boolean;
  refreshData: () => void;
  createProject: (projectData: Partial<Project>) => Promise<Project>;
  createMilestone: (milestoneData: Partial<Milestone>) => Promise<Milestone>;
  updateMilestone: (milestoneId: string, data: Partial<Milestone>) => Promise<Milestone>;
  submitMilestone: (milestoneId: string) => Promise<Milestone>;
  approveMilestone: (milestoneId: string) => Promise<Milestone>;
  getProjectData: (projectId: string) => {
    project: Project | null;
    milestones: Milestone[];
    transactions: Transaction[];
    invoices: Invoice[];
  };
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

interface MockDataProviderProps {
  children: ReactNode;
}

export const MockDataProvider: React.FC<MockDataProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize mock data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      
      // In a real implementation, you might fetch from the API or use mock data
      // For now, we'll use the static mock data
      setUsers(getMockUsers());
      setProjects(getMockProjects());
      setMilestones(getMockMilestones());
      setTransactions(getMockTransactions());
      setInvoices(getMockInvoices());
      setEscrowAccounts(getMockEscrowAccounts());
      setDisputes(getMockDisputes());
      setNotifications(getMockNotifications());
      
      setLoading(false);
    };

    initializeData();
  }, []);

  const refreshData = () => {
    setUsers(getMockUsers());
    setProjects(getMockProjects());
    setMilestones(getMockMilestones());
    setTransactions(getMockTransactions());
    setInvoices(getMockInvoices());
    setEscrowAccounts(getMockEscrowAccounts());
    setDisputes(getMockDisputes());
    setNotifications(getMockNotifications());
  };

  const createProject = async (projectData: Partial<Project>): Promise<Project> => {
    const newProject = generateMockProject(projectData);
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const createMilestone = async (milestoneData: Partial<Milestone>): Promise<Milestone> => {
    const newMilestone = generateMockMilestone(milestoneData);
    setMilestones(prev => [...prev, newMilestone]);
    return newMilestone;
  };

  const updateMilestone = async (milestoneId: string, data: Partial<Milestone>): Promise<Milestone> => {
    const updatedMilestones = milestones.map(m => 
      m.id === milestoneId ? { ...m, ...data, updatedAt: new Date() } : m
    );
    setMilestones(updatedMilestones);
    return updatedMilestones.find(m => m.id === milestoneId)!;
  };

  const submitMilestone = async (milestoneId: string): Promise<Milestone> => {
    const updatedMilestones = milestones.map(m => 
      m.id === milestoneId ? { ...m, status: 'SUBMITTED', updatedAt: new Date() } : m
    );
    setMilestones(updatedMilestones);
    return updatedMilestones.find(m => m.id === milestoneId)!;
  };

  const approveMilestone = async (milestoneId: string): Promise<Milestone> => {
    const updatedMilestones = milestones.map(m => 
      m.id === milestoneId ? { ...m, status: 'APPROVED', updatedAt: new Date() } : m
    );
    setMilestones(updatedMilestones);
    return updatedMilestones.find(m => m.id === milestoneId)!;
  };

  const getProjectData = (projectId: string) => {
    const project = projects.find(p => p.id === projectId) || null;
    const projectMilestones = milestones.filter(m => m.projectId === projectId);
    const projectTransactions = transactions.filter(t => t.projectId === projectId);
    const projectInvoices = invoices.filter(i => i.projectId === projectId);

    return {
      project,
      milestones: projectMilestones,
      transactions: projectTransactions,
      invoices: projectInvoices
    };
  };

  const value = {
    users,
    projects,
    milestones,
    transactions,
    invoices,
    escrowAccounts,
    disputes,
    notifications,
    loading,
    refreshData,
    createProject,
    createMilestone,
    updateMilestone,
    submitMilestone,
    approveMilestone,
    getProjectData
  };

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
};

export const useMockData = (): MockDataContextType => {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
};

// Note: The useData hook has been commented out as it depends on hooks that may not be available
// You can implement this after setting up the necessary hooks and authentication store
/*
export const useData = () => {
  const { isAuthenticated } = useAuthStore(); // This might not be available

  if (isAuthenticated) {
    // Use real API when authenticated
    return {
      projects: useProjects(), // This hook needs to be imported
      milestones: useMilestones(), // This hook needs to be imported
      // Add other real API hooks as needed
    };
  } else {
    // Use mock data when not authenticated or during development
    return useMockData();
  }
};
*/