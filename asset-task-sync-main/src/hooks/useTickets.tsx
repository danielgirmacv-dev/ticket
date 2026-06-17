import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import laravelClient, { MaintenanceTicket } from '@/integrations/laravel/client';
import { toast } from 'sonner';

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
        mutationFn: async (data: Partial<MaintenanceTicket>) => {
            const response = await laravelClient.post('/maintenance-tickets', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success('Ticket created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create ticket');
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
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update ticket');
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
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete ticket');
        }
    });
}
