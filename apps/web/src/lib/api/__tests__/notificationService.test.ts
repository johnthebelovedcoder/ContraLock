import { notificationService } from '../api/notificationService';
import { apiClient } from '../api/client';

// Mock the API client
jest.mock('../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should fetch notifications for a user', async () => {
      const mockNotifications = [
        { id: '1', type: 'MILESTONE_SUBMITTED', message: 'Milestone submitted', isRead: false },
        { id: '2', type: 'PROJECT_INVITE', message: 'Project invite', isRead: true },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockNotifications });

      const result = await notificationService.getNotifications('user123');

      expect(apiClient.get).toHaveBeenCalledWith('/notifications?userId=user123');
      expect(result).toEqual(mockNotifications);
    });

    it('should fetch notifications with filters', async () => {
      const mockNotifications = [
        { id: '1', type: 'MILESTONE_SUBMITTED', message: 'Milestone submitted', isRead: false },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockNotifications });

      const result = await notificationService.getNotifications('user123', { 
        type: 'MILESTONE_SUBMITTED', 
        isRead: false 
      });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/notifications?userId=user123&type=MILESTONE_SUBMITTED&isRead=false'
      );
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = { 
        id: '1', 
        type: 'MILESTONE_SUBMITTED', 
        message: 'Milestone submitted', 
        isRead: true 
      };

      (apiClient.put as jest.Mock).mockResolvedValue({ data: mockNotification });

      const result = await notificationService.markAsRead('1');

      expect(apiClient.put).toHaveBeenCalledWith('/notifications/1/read');
      expect(result).toEqual(mockNotification);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      (apiClient.put as jest.Mock).mockResolvedValue({});

      await notificationService.markAllAsRead('user123');

      expect(apiClient.put).toHaveBeenCalledWith('/notifications/read-all', { userId: 'user123' });
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({});

      await notificationService.deleteNotification('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/notifications/1');
    });
  });
});