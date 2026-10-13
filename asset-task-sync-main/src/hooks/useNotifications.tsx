import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
        // 15s polling + focus refetch = fresh bell without 12 req/min per user
        refetchInterval: 15000,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        staleTime: 10000,
        placeholderData: keepPreviousData,
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
        onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    });
}

/** Mark ALL unread as read in one shot with automatic fallback */
export function useMarkAllRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            try {
                // Primary: call the fast bulk mark-all-read endpoint
                await laravelClient.post('/notifications/mark-all-read');
            } catch (err: any) {
                // Fallback: If backend endpoint is 404 or 405 (e.g. cached route on production),
                // fetch unread list from server and mark each one individually
                if (err?.response?.status === 404 || err?.response?.status === 405) {
                    const res = await laravelClient.get('/notifications?is_read=false');
                    const unreadList: Notification[] = Array.isArray(res.data) ? res.data : [];
                    if (unreadList.length > 0) {
                        await Promise.allSettled(
                            unreadList.map(n => laravelClient.patch(`/notifications/${n.id}/mark-read`))
                        );
                    }
                } else {
                    throw err;
                }
            }
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
        onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    });
}
