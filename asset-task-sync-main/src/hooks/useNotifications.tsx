import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import laravelClient, { Notification } from '@/integrations/laravel/client';

/**
 * Central notifications hook — polls every 5 seconds.
 * Used by both the Header bell and the Notifications page so state
 * is always in sync without any manual refreshes.
 */
export function useNotifications() {
    return useQuery<Notification[]>({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await laravelClient.get('/notifications');
            return res.data;
        },
        refetchInterval: 5000,
        refetchIntervalInBackground: false,
        staleTime: 3000,
    });
}

/** Mark a single notification as read — optimistically updates UI immediately */
export function useMarkAsRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await laravelClient.patch(`/notifications/${id}/mark-read`);
        },
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: ['notifications'] });
            const prev = qc.getQueryData<Notification[]>(['notifications']);
            qc.setQueryData<Notification[]>(['notifications'], (old = []) =>
                old.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            return { prev };
        },
        onError: (_e, _id, ctx) => {
            if (ctx?.prev) qc.setQueryData(['notifications'], ctx.prev);
        },
    });
}

/** Mark ALL unread as read in one shot */
export function useMarkAllRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await laravelClient.post('/notifications/mark-all-read');
        },
        onMutate: async () => {
            await qc.cancelQueries({ queryKey: ['notifications'] });
            const prev = qc.getQueryData<Notification[]>(['notifications']);
            qc.setQueryData<Notification[]>(['notifications'], (old = []) =>
                old.map(n => ({ ...n, is_read: true }))
            );
            return { prev };
        },
        onError: (_e, _v, ctx) => {
            if (ctx?.prev) qc.setQueryData(['notifications'], ctx.prev);
        },
        onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    });
}

/** Delete a notification permanently */
export function useDeleteNotification() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await laravelClient.delete(`/notifications/${id}`);
        },
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: ['notifications'] });
            const prev = qc.getQueryData<Notification[]>(['notifications']);
            qc.setQueryData<Notification[]>(['notifications'], (old = []) =>
                old.filter(n => n.id !== id)
            );
            return { prev };
        },
        onError: (_e, _id, ctx) => {
            if (ctx?.prev) qc.setQueryData(['notifications'], ctx.prev);
        },
    });
}
