// Mock Data Hook
// Provides a simple way to access mock data in components during development

import { useState, useEffect } from 'react';
import { 
  getMockUsers,
  getMockProjects,
  getMockMilestones,
  getMockTransactions,
  getMockInvoices,
  getMockEscrowAccounts,
  getMockDisputes,
  getMockNotifications
} from '@/lib/mock-data';

// Simple hook to access mock data directly
export const useMockData = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [escrowAccounts, setEscrowAccounts] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load mock data
    setUsers(getMockUsers());
    setProjects(getMockProjects());
    setMilestones(getMockMilestones());
    setTransactions(getMockTransactions());
    setInvoices(getMockInvoices());
    setEscrowAccounts(getMockEscrowAccounts());
    setDisputes(getMockDisputes());
    setNotifications(getMockNotifications());
    
    setLoading(false);
  }, []);

  return {
    users,
    projects,
    milestones,
    transactions,
    invoices,
    escrowAccounts,
    disputes,
    notifications,
    loading,
    // Helper functions
    getUserById: (id: string) => users.find(user => user.id === id),
    getProjectById: (id: string) => projects.find(project => project.id === id),
    getMilestonesByProjectId: (projectId: string) => milestones.filter(ms => ms.projectId === projectId),
    getTransactionsByProjectId: (projectId: string) => transactions.filter(tx => tx.projectId === projectId),
    getInvoicesByProjectId: (projectId: string) => invoices.filter(inv => inv.projectId === projectId),
  };
};

// Specific hooks for different data types
export const useMockProjects = () => {
  const { projects, loading } = useMockData();
  return { projects, loading };
};

export const useMockMilestones = (projectId?: string) => {
  const { milestones, loading } = useMockData();
  const projectMilestones = projectId 
    ? milestones.filter(m => m.projectId === projectId) 
    : milestones;
  
  return { milestones: projectMilestones, loading };
};

export const useMockTransactions = (projectId?: string) => {
  const { transactions, loading } = useMockData();
  const projectTransactions = projectId 
    ? transactions.filter(t => t.projectId === projectId) 
    : transactions;
  
  return { transactions: projectTransactions, loading };
};

export const useMockNotifications = (userId?: string) => {
  const { notifications, loading } = useMockData();
  const userNotifications = userId 
    ? notifications.filter(n => n.userId === userId) 
    : notifications;
  
  return { notifications: userNotifications, loading };
};

// Hook for dashboard data
export const useMockDashboardData = (userId: string, userType: 'client' | 'freelancer') => {
  const { 
    projects, 
    transactions, 
    notifications, 
    loading 
  } = useMockData();
  
  // Filter projects based on user type
  const userProjects = projects.filter(project => {
    if (userType === 'client') {
      return project.clientId === userId;
    } else if (userType === 'freelancer') {
      return project.freelancerId === userId;
    }
    return true;
  });
  
  // Calculate metrics
  const activeProjects = userProjects.filter(p => p.status === 'ACTIVE').length;
  const completedProjects = userProjects.filter(p => p.status === 'COMPLETED').length;
  const totalBudget = userProjects.reduce((sum, p) => sum + p.totalBudget, 0);
  const pendingMilestones = userProjects.flatMap(p => 
    milestones.filter(m => m.projectId === p.id && m.status === 'SUBMITTED')
  ).length;
  
  const userNotifications = notifications.filter(n => n.userId === userId);
  const unreadNotifications = userNotifications.filter(n => !n.read).length;
  
  return {
    projects: userProjects,
    transactions: transactions.filter(t => 
      userProjects.some(p => p.id === t.projectId)
    ),
    notifications: userNotifications,
    metrics: {
      activeProjects,
      completedProjects,
      totalBudget,
      pendingMilestones,
      unreadNotifications
    },
    loading
  };
};