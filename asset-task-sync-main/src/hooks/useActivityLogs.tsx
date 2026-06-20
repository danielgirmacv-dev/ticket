import { useQuery } from '@tanstack/react-query';
import laravelClient, { ActivityLog } from '@/integrations/laravel/client';

export function useActivityLogs() {
    return useQuery({
        queryKey: ['activity-logs'],
        queryFn: async (): Promise<ActivityLog[]> => {
            const response = await laravelClient.get('/activity-logs', { params: { limit: 100 } });
            return response.data;
        }
    });
}
