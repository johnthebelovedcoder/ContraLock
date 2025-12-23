import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/lib/api';

interface UseProjectsParams {
  userId: string;
  filters?: Record<string, any>;
  pagination?: { page: number; limit: number };
}

export const useProjects = (userId: string, filters: Record<string, any> = {}, pagination = { page: 1, limit: 10 }) => {
  return useQuery({
    queryKey: ['projects', userId, filters, pagination],
    queryFn: async () => {
      const result = await projectService.getProjects(userId, filters, pagination);
      return result;
    },
    enabled: !!userId,
  });
};