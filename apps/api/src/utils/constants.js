// Notification Types
export const NotificationType = {
  MILESTONE_AUTO_ACCEPTED: 'MILESTONE_AUTO_ACCEPTED',
  MILESTONE_COMPLETED: 'MILESTONE_COMPLETED',
  MILESTONE_APPROVED: 'MILESTONE_APPROVED',
  MILESTONE_REJECTED: 'MILESTONE_REJECTED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_RELEASED: 'PAYMENT_RELEASED',
  PROJECT_STARTED: 'PROJECT_STARTED',
  PROJECT_COMPLETED: 'PROJECT_COMPLETED',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  SYSTEM_NOTIFICATION: 'SYSTEM_NOTIFICATION'
};

// Milestone Statuses
export const MilestoneStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Project Statuses
export const ProjectStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// User Roles
export const UserRole = {
  FREELANCER: 'freelancer',
  CLIENT: 'client',
  ADMIN: 'admin'
};

// Default values
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default {
  NotificationType,
  MilestoneStatus,
  ProjectStatus,
  UserRole,
  DEFAULT_PAGE_SIZE,
  MAX_FILE_SIZE
};
