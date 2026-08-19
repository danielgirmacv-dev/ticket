import { useMutation, useQueryClient } from '@tanstack/react-query';
import laravelClient, { MaintenanceTicket } from '@/integrations/laravel/client';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';

interface ApproveTicketData {
    id: string;
}

interface RejectTicketData {
    id: string;
    rejection_reason: string;
}

interface AssignTicketData {
    id: string;
    assigned_technician_id: string;
}

interface UpdateProgressData {
    id: string;
    diagnosis?: string;
    actions_taken?: string;
    spare_parts?: Array<{ name: string; quantity: number; cost?: number }>;
    estimated_duration?: number;
}

interface CompleteTicketData {
    id: string;
    actions_taken: string;
    spare_parts?: Array<{ name: string; quantity: number; cost?: number }>;
    images?: { before?: string[]; after?: string[] };
    actual_duration?: number;
}

interface ReviewCompletionData {
    id: string;
    approved: boolean;
    notes?: string;
}

interface SubmitFeedbackData {
    id: string;
    feedback_rating: number;
    feedback_comment?: string;
}

// Approve ticket (Admin) - Optimistic UI
export function useApproveTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ApproveTicketData) => {
            const response = await laravelClient.post(`/maintenance-tickets/${data.id}/approve`);
            return response.data;
        },
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: ['tickets'] });
            const previousTickets = queryClient.getQueryData<MaintenanceTicket[]>(['tickets']);

            if (previousTickets) {
                queryClient.setQueryData<MaintenanceTicket[]>(['tickets'], (old) =>
                    old?.map((t) => (t.id === data.id ? { ...t, status: 'approved' } : t))
                );
            }
            toast.success('Ticket approved');
            return { previousTickets };
        },
        onError: (error, _, context) => {
            if (context?.previousTickets) {
                queryClient.setQueryData(['tickets'], context.previousTickets);
            }
            toast.error(getApiErrorMessage(error, 'Failed to approve ticket'));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
}

// Reject ticket (Admin) - Optimistic UI
export function useRejectTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: RejectTicketData) => {
            const response = await laravelClient.post(`/maintenance-tickets/${data.id}/reject`, {
                rejection_reason: data.rejection_reason,
            });
            return response.data;
        },
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: ['tickets'] });
            const previousTickets = queryClient.getQueryData<MaintenanceTicket[]>(['tickets']);

            if (previousTickets) {
                queryClient.setQueryData<MaintenanceTicket[]>(['tickets'], (old) =>
                    old?.map((t) => (t.id === data.id ? { ...t, status: 'rejected' } : t))
                );
            }
            toast.success('Ticket rejected');
            return { previousTickets };
        },
        onError: (error, _, context) => {
            if (context?.previousTickets) {
                queryClient.setQueryData(['tickets'], context.previousTickets);
            }
            toast.error(getApiErrorMessage(error, 'Failed to reject ticket'));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
}

// Assign technician (Admin) - Optimistic UI
export function useAssignTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: AssignTicketData) => {
            const response = await laravelClient.post(`/maintenance-tickets/${data.id}/assign`, {
                assigned_technician_id: data.assigned_technician_id,
            });
            return response.data;
        },
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: ['tickets'] });
            const previousTickets = queryClient.getQueryData<MaintenanceTicket[]>(['tickets']);

            if (previousTickets) {
                queryClient.setQueryData<MaintenanceTicket[]>(['tickets'], (old) =>
                    old?.map((t) => (t.id === data.id ? { ...t, status: 'assigned', assigned_technician_id: data.assigned_technician_id } : t))
                );
            }
            toast.success('Technician assigned');
            return { previousTickets };
        },
        onError: (error, _, context) => {
            if (context?.previousTickets) {
                queryClient.setQueryData(['tickets'], context.previousTickets);
            }
            toast.error(getApiErrorMessage(error, 'Failed to assign technician'));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
}

// Start ticket (Technician) - Optimistic UI
export function useStartTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await laravelClient.post(`/maintenance-tickets/${id}/start`);
            return response.data;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['tickets'] });
            const previousTickets = queryClient.getQueryData<MaintenanceTicket[]>(['tickets']);

            if (previousTickets) {
                queryClient.setQueryData<MaintenanceTicket[]>(['tickets'], (old) =>
                    old?.map((t) => (t.id === id ? { ...t, status: 'in_progress' } : t))
                );
            }
            toast.success('Ticket started');
            return { previousTickets };
        },
        onError: (error, _, context) => {
            if (context?.previousTickets) {
                queryClient.setQueryData(['tickets'], context.previousTickets);
            }
            toast.error(getApiErrorMessage(error, 'Failed to start ticket'));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
}

// Update progress (Technician)
export function useUpdateProgress() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateProgressData) => {
            const { id, ...updateData } = data;
            const response = await laravelClient.post(`/maintenance-tickets/${id}/update-progress`, updateData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success('Progress updated');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to update progress'));
        },
    });
}

// Complete ticket (Technician) - Optimistic UI
export function useCompleteTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CompleteTicketData) => {
            const { id, ...completeData } = data;
            const response = await laravelClient.post(`/maintenance-tickets/${id}/complete`, completeData);
            return response.data;
        },
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: ['tickets'] });
            const previousTickets = queryClient.getQueryData<MaintenanceTicket[]>(['tickets']);

            if (previousTickets) {
                queryClient.setQueryData<MaintenanceTicket[]>(['tickets'], (old) =>
                    old?.map((t) => (t.id === data.id ? { ...t, status: 'completed_pending_review' } : t))
                );
            }
            toast.success('Ticket marked as completed');
            return { previousTickets };
        },
        onError: (error, _, context) => {
            if (context?.previousTickets) {
                queryClient.setQueryData(['tickets'], context.previousTickets);
            }
            toast.error(getApiErrorMessage(error, 'Failed to complete ticket'));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
}

// Review completion (Admin) - Optimistic UI
export function useReviewCompletion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ReviewCompletionData) => {
            const { id, ...reviewData } = data;
            const response = await laravelClient.post(`/maintenance-tickets/${id}/review-completion`, reviewData);
            return response.data;
        },
        onMutate: async (data) => {
            await queryClient.cancelQueries({ queryKey: ['tickets'] });
            const previousTickets = queryClient.getQueryData<MaintenanceTicket[]>(['tickets']);

            if (previousTickets) {
                const nextStatus = data.approved ? 'completed' : 'reopened';
                queryClient.setQueryData<MaintenanceTicket[]>(['tickets'], (old) =>
                    old?.map((t) => (t.id === data.id ? { ...t, status: nextStatus } : t))
                );
            }
            toast.success(data.approved ? 'Ticket approved' : 'Ticket reopened for revision');
            return { previousTickets };
        },
        onError: (error, _, context) => {
            if (context?.previousTickets) {
                queryClient.setQueryData(['tickets'], context.previousTickets);
            }
            toast.error(getApiErrorMessage(error, 'Failed to review ticket'));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
}

// Submit feedback (Requester)
export function useSubmitFeedback() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: SubmitFeedbackData) => {
            const { id, ...feedbackData } = data;
            const response = await laravelClient.post(`/maintenance-tickets/${id}/feedback`, feedbackData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success('Thank you for your feedback!');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to submit feedback'));
        },
    });
}

// Delete ticket (Admin) - Optimistic UI
export function useDeleteTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await laravelClient.delete(`/maintenance-tickets/${id}`);
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['tickets'] });
            const previousTickets = queryClient.getQueryData<MaintenanceTicket[]>(['tickets']);

            if (previousTickets) {
                queryClient.setQueryData<MaintenanceTicket[]>(['tickets'], (old) =>
                    old?.filter((t) => t.id !== id)
                );
            }
            toast.success('Ticket deleted successfully');
            return { previousTickets };
        },
        onError: (error, _, context) => {
            if (context?.previousTickets) {
                queryClient.setQueryData(['tickets'], context.previousTickets);
            }
            toast.error(getApiErrorMessage(error, 'Failed to delete ticket'));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
        },
    });
}
