import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import laravelClient, { MaintenanceTicket } from '@/integrations/laravel/client';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';

export function useTickets() {
    return useQuery({
        queryKey: ['tickets'],
        queryFn: async (): Promise<MaintenanceTicket[]> => {
            const response = await laravelClient.get('/maintenance-tickets');
            return response.data;
        }
    });
}

export function useCreateTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<MaintenanceTicket> | FormData) => {
            const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
            const response = await laravelClient.post(
                '/maintenance-tickets',
                data,
                isFormData
                    ? { headers: { 'Content-Type': 'multipart/form-data' } }
                    : undefined
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success('Ticket created successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to create ticket'));
        }
    });
}

export function useUpdateTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<MaintenanceTicket> & { id: string }) => {
            const response = await laravelClient.put(`/maintenance-tickets/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success('Ticket updated successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to update ticket'));
        }
    });
}

export function useDeleteTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await laravelClient.delete(`/maintenance-tickets/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success('Ticket deleted successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to delete ticket'));
        }
    });
}
