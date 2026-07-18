import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import laravelClient, { Faq } from '@/integrations/laravel/client';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';

export function useFaqs(params?: { search?: string; category?: string; is_published?: boolean }) {
    return useQuery({
        queryKey: ['faqs', params],
        queryFn: async (): Promise<Faq[]> => {
            const response = await laravelClient.get('/faqs', { params });
            return response.data;
        },
    });
}

export function useCreateFaq() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Faq>) => {
            const response = await laravelClient.post('/faqs', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            toast.success('FAQ created');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to create FAQ'));
        },
    });
}

export function useUpdateFaq() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<Faq> & { id: string }) => {
            const response = await laravelClient.put(`/faqs/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            toast.success('FAQ updated');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to update FAQ'));
        },
    });
}

export function useDeleteFaq() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await laravelClient.delete(`/faqs/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            toast.success('FAQ deleted');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to delete FAQ'));
        },
    });
}
