import { useQuery } from '@tanstack/react-query';
import { paymentService } from '@/lib/api';

export const useTransactions = (userId: string, filters: Record<string, any> = {}) => {
  return useQuery({
    queryKey: ['transactions', userId, filters],
    queryFn: async () => {
      return await paymentService.getTransactions(userId, filters);
    },
    enabled: !!userId,
  });
};