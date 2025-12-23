import { create } from 'zustand';
import { Notification } from '@/types';
import { notificationService } from '../api/notificationService';

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;

  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  error: null,

  fetchNotifications: async (userId) => {
    set({ loading: true });
    try {
      const notifications = await notificationService.getNotifications(userId);
      set({ notifications, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch notifications', loading: false });
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        ),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to mark notification as read' });
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const currentState = get();
      if (currentState.notifications && currentState.notifications.length > 0) {
        const userId = currentState.notifications[0].userId; // Assuming all notifications belong to same user
        await notificationService.markAllAsRead(userId);
        set((state) => ({
          notifications: state.notifications.map(notif => ({ ...notif, isRead: true })),
        }));
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to mark all notifications as read' });
      throw error;
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      set((state) => ({
        notifications: state.notifications.filter(notif => notif.id !== notificationId),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete notification' });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));