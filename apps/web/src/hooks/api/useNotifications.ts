import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/lib/api';

export const useNotifications = (userId: string) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      // Using a simple filter object since the actual filtering parameters may vary
      return await notificationService.getNotifications(userId, { limit: 10, page: 1 });
    },
    enabled: !!userId,
  });
};