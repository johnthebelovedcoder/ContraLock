import { Notification } from '@/types';
import { apiClient } from './client';

export interface NotificationFilters {
  type?: string;
  isRead?: boolean;
  limit?: number;
  page?: number;
}

class NotificationService {
  async getNotifications(
    userId: string,
    filters?: NotificationFilters
  ): Promise<Notification[]> {
    try {
      const params = new URLSearchParams({
        userId,
        ...(filters || {})
      });

      const response = await apiClient.get(`/api/v1/notifications?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await apiClient.put(`/api/v1/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await apiClient.put('/api/v1/notifications/read-all', { userId });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/notifications/${notificationId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await apiClient.get(`/api/v1/notifications/unread-count?userId=${userId}`);
      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();