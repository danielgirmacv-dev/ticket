import { useQuery } from '@tanstack/react-query';
import laravelClient, { ActivityLog } from '@/integrations/laravel/client';

export function useActivityLogs() {
    return useQuery({
        queryKey: ['activity-logs'],
        queryFn: async (): Promise<ActivityLog[]> => {
            // We haven't implemented an ActivityLogController yet, but we should.
            // For now, let's assume it exists or we might need to create it.
            // Wait, I did create ActivityLog model and migration, but did I create a controller?
            // I need to check if I created ActivityLogController.
            // If not, I should create it on the backend first.
            // Checking my previous steps... I created Auth, Asset, MaintenanceTicket, Notification, Profile controllers.
            // I did NOT create ActivityLogController.

            // So I need to create ActivityLogController on the backend first.
            // But I am in the frontend integration phase.
            // I can create the hook now and it will fail until I create the controller.
            // Or I can switch to backend to create the controller.

            // Let's check if I can quickly create the controller.
            // Yes, I should create the controller.

            const response = await laravelClient.get('/activity-logs');
            return response.data;
        }
    });
}
