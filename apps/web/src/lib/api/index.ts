import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  authService
} from './authService';
import {
  userService
} from './userService';
import {
  projectService
} from './projectService';
import {
  paymentService
} from './paymentService';
import {
  messagingService
} from './messagingService';
import {
  adminService
} from './adminService';

// Auth hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: authService.login,
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authService.register,
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// User hooks
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUserById(userId),
  });
};

export const useKYCVerification = (userId: string) => {
  return useQuery({
    queryKey: ['kyc', userId],
    queryFn: () => userService.getKYCVerification(userId),
  });
};

export const usePaymentMethods = (userId: string) => {
  return useQuery({
    queryKey: ['paymentMethods', userId],
    queryFn: () => userService.getPaymentMethods(userId),
  });
};

// Project hooks
export const useProjects = (userId: string, filters = {}, pagination = { page: 1, limit: 10 }) => {
  return useQuery({
    queryKey: ['projects', userId, filters, pagination],
    queryFn: () => projectService.getProjects(userId, filters, pagination),
  });
};

export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectService.getProjectById(projectId),
  });
};

export const useMilestones = (projectId: string) => {
  return useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => projectService.getMilestones(projectId),
  });
};

export const useMilestone = (milestoneId: string) => {
  return useQuery({
    queryKey: ['milestone', milestoneId],
    queryFn: () => projectService.getMilestoneById(milestoneId),
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => projectService.updateProject(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// Payment hooks
export const useEscrowAccount = (projectId: string) => {
  return useQuery({
    queryKey: ['escrow', projectId],
    queryFn: () => paymentService.getEscrowAccount(projectId),
  });
};

export const useUserBalance = (userId: string) => {
  return useQuery({
    queryKey: ['balance', userId],
    queryFn: () => paymentService.getUserBalance(userId),
  });
};

export const useTransactions = (userId: string, filters = {}) => {
  return useQuery({
    queryKey: ['transactions', userId, filters],
    queryFn: () => paymentService.getTransactions(userId, filters),
  });
};

export const useDepositFunds = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentService.depositFunds,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escrow', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

// Messaging hooks
export const useConversations = (userId: string) => {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: () => messagingService.getConversations(userId),
  });
};

export const useMessages = (projectId: string, page = 1, limit = 50) => {
  return useQuery({
    queryKey: ['messages', projectId, page, limit],
    queryFn: () => messagingService.getMessages(projectId, page, limit),
  });
};

export const useSendMessage = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: messagingService.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', projectId] });
    },
  });
};

// Dispute hooks
export const useDisputes = (userId: string, status?: string) => {
  return useQuery({
    queryKey: ['disputes', userId, status],
    queryFn: () => messagingService.getDisputes(userId, status),
  });
};

export const useDispute = (disputeId: string) => {
  return useQuery({
    queryKey: ['dispute', disputeId],
    queryFn: () => messagingService.getDisputeById(disputeId),
  });
};

// Admin hooks
export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminService.getDashboard(),
  });
};

export const useAdminUsers = (params = {}) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.getUsers(params),
  });
};

export const useAdminUser = (userId: string) => {
  return useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => adminService.getUser(userId),
  });
};

export const useAdminProjects = (params = {}) => {
  return useQuery({
    queryKey: ['admin', 'projects', params],
    queryFn: () => adminService.getProjects(params),
  });
};

export const useAdminProject = (projectId: string) => {
  return useQuery({
    queryKey: ['admin', 'project', projectId],
    queryFn: () => adminService.getProject(projectId),
  });
};

export const useAdminDisputes = (params = {}) => {
  return useQuery({
    queryKey: ['admin', 'disputes', params],
    queryFn: () => adminService.getDisputes(params),
  });
};

export const useAdminDispute = (disputeId: string) => {
  return useQuery({
    queryKey: ['admin', 'dispute', disputeId],
    queryFn: () => adminService.getDispute(disputeId),
  });
};

export const useAdminAnalyticsSummary = () => {
  return useQuery({
    queryKey: ['admin', 'analytics', 'summary'],
    queryFn: () => adminService.getAnalyticsSummary(),
  });
};

export const useAdminTransactions = (params = {}) => {
  return useQuery({
    queryKey: ['admin', 'transactions', params],
    queryFn: () => adminService.getTransactions(params),
  });
};

export const useCreateDispute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => messagingService.createDispute(data.milestoneId, data.disputeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
};

// Notification hooks
export const useNotifications = (userId: string) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationService.getNotifications(userId),
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// File upload hooks
export const useUploadFile = () => {
  return useMutation({
    mutationFn: (data: { file: File, additionalData?: Record<string, any> }) =>
      fileService.uploadFile(data.file, data.additionalData),
  });
};

export const useUploadMultipleFiles = () => {
  return useMutation({
    mutationFn: fileService.uploadMultipleFiles,
  });
};

export const useUploadMilestoneDeliverables = () => {
  return useMutation({
    mutationFn: (data: { projectId: string, milestoneId: string, files: File[] }) =>
      fileService.uploadMilestoneDeliverables(data.projectId, data.milestoneId, data.files),
  });
};

// Export the service modules
export { projectService } from './projectService';
export { messagingService } from './messagingService';
export { paymentService } from './paymentService';
export { authService } from './authService';
export { userService } from './userService';
export { notificationService } from './notificationService';
export { fileService } from './fileService';
export { adminService } from './adminService';