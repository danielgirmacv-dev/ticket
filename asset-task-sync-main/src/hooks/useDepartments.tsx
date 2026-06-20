import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import laravelClient, { Department } from '@/integrations/laravel/client';
import { toast } from 'sonner';

export function useDepartments() {
    return useQuery({
        queryKey: ['departments'],
        queryFn: async (): Promise<Department[]> => {
            const response = await laravelClient.get('/departments');
            return response.data;
        }
    });
}

export function useCreateDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Department>) => {
            const response = await laravelClient.post('/departments', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department created successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create department');
        }
    });
}

export function useUpdateDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<Department> & { id: string }) => {
            const response = await laravelClient.put(`/departments/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update department');
        }
    });
}

export function useDeleteDepartment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await laravelClient.delete(`/departments/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete department');
        }
    });
}

export function useImportDepartmentsCsv() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            const response = await laravelClient.post('/departments/import-csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });

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
