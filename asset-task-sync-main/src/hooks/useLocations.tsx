import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import laravelClient, { Location } from '@/integrations/laravel/client';
import { toast } from 'sonner';

export function useLocations() {
    return useQuery({
        queryKey: ['locations'],
        queryFn: async (): Promise<Location[]> => {
            const response = await laravelClient.get('/locations');
            return response.data;
        }
    });
}

export function useCreateLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Location>) => {
            const response = await laravelClient.post('/locations', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            toast.success('Location created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create location');
        }
    });
}

export function useUpdateLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<Location> & { id: string }) => {
            const response = await laravelClient.put(`/locations/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            toast.success('Location updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update location');
        }
    });
}

export function useDeleteLocation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await laravelClient.delete(`/locations/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });
            toast.success('Location deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete location');
        }
    });
}

export function useImportLocationsCsv() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            const response = await laravelClient.post('/locations/import-csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['locations'] });

            if (data.error_count > 0) {
                toast.warning(data.message, {
                    description: `${data.success_count} imported, ${data.error_count} failed`
                });
            } else {
                toast.success(data.message);
            }
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to import CSV';
            toast.error(errorMessage);
        }
    });
}
