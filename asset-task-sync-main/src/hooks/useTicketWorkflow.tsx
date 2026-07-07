import { useMutation, useQueryClient } from '@tanstack/react-query';
import laravelClient from '@/integrations/laravel/client';
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

// Approve ticket (Admin)
export function useApproveTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ApproveTicketData) => {
            const response = await laravelClient.post(`/maintenance-tickets/${data.id}/approve`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success('Ticket approved successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to approve ticket'));
        },
    });
}

// Reject ticket (Admin)
export function useRejectTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: RejectTicketData) => {
            const response = await laravelClient.post(`/maintenance-tickets/${data.id}/reject`, {
                rejection_reason: data.rejection_reason,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success('Ticket rejected');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to reject ticket'));
        },
    });
}

// Assign technician (Admin)
export function useAssignTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: AssignTicketData) => {
            const response = await laravelClient.post(`/maintenance-tickets/${data.id}/assign`, {
                assigned_technician_id: data.assigned_technician_id,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success('Technician assigned successfully');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to assign technician'));
        },
    });
}

// Start ticket (Technician)
export function useStartTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await laravelClient.post(`/maintenance-tickets/${id}/start`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success('Ticket started');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to start ticket'));
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

// Complete ticket (Technician)
export function useCompleteTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CompleteTicketData) => {
            const { id, ...completeData } = data;
            const response = await laravelClient.post(`/maintenance-tickets/${id}/complete`, completeData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success('Ticket marked as completed');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to complete ticket'));
        },
    });
}

// Review completion (Admin)
export function useReviewCompletion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: ReviewCompletionData) => {
            const { id, ...reviewData } = data;
            const response = await laravelClient.post(`/maintenance-tickets/${id}/review-completion`, reviewData);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast.success(variables.approved ? 'Ticket approved' : 'Ticket reopened for revision');
        },
        onError: (error) => {
            toast.error(getApiErrorMessage(error, 'Failed to review ticket'));
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

// Delete ticket (Admin)
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
        },
    });
}
