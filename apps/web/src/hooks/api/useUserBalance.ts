import { useQuery } from '@tanstack/react-query';
import { paymentService } from '@/lib/api';

export const useUserBalance = (userId: string) => {
  return useQuery({
    queryKey: ['userBalance', userId],
    queryFn: async () => {
      return await paymentService.getUserBalance(userId);
    },
    enabled: !!userId,
  });
};