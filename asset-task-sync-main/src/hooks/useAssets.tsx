import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import laravelClient, { Asset } from '@/integrations/laravel/client';
import { toast } from 'sonner';

export function useAssets() {
    return useQuery({
        queryKey: ['assets'],
        queryFn: async (): Promise<Asset[]> => {
            const response = await laravelClient.get('/assets');
            return response.data;
        }
    });
}

export function useCreateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Asset>) => {
            const response = await laravelClient.post('/assets', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            toast.success('Asset created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create asset');
        }
    });
}

export function useUpdateAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<Asset> & { id: string }) => {
            const response = await laravelClient.put(`/assets/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            toast.success('Asset updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update asset');
        }
    });
}

export function useDeleteAsset() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await laravelClient.delete(`/assets/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            toast.success('Asset deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete asset');
        }
    });
}

export function useImportAssetsCsv() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            const response = await laravelClient.post('/assets/import-csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });

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
