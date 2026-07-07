import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import laravelClient from '@/integrations/laravel/client';
import { MaintenanceSchedule } from '@/types/schedule';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';

// Fetch all schedules
export function useMaintenanceSchedules(assetId?: string) {
    return useQuery({
        queryKey: ['schedules', assetId],
        queryFn: async () => {
            const params = assetId ? { asset_id: assetId } : {};
            const response = await laravelClient.get('/maintenance-schedules', { params });
            return response.data as MaintenanceSchedule[];
        },
    });
}

// Create schedule
export function useCreateSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<MaintenanceSchedule>) => {
            const response = await laravelClient.post('/maintenance-schedules', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            toast.success('Schedule created successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to create schedule'));
        },
    });
}

// Update schedule
export function useUpdateSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<MaintenanceSchedule> & { id: string }) => {
            const response = await laravelClient.put(`/maintenance-schedules/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            toast.success('Schedule updated successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to update schedule'));
        },
    });
}

// Delete schedule
export function useDeleteSchedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await laravelClient.delete(`/maintenance-schedules/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            toast.success('Schedule deleted successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to delete schedule'));
        },
    });
}
