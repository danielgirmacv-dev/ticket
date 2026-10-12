import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    useNotifications,
    useMarkAsRead,
    useMarkAllRead,
    useDeleteNotification,
} from '@/hooks/useNotifications';
import { Notification } from '@/integrations/laravel/client';
import { format } from 'date-fns';
import { CheckCheck, Bell, Trash2, ExternalLink, BellOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TYPE_DOT: Record<string, string> = {
    warning: 'bg-yellow-400',
    success: 'bg-emerald-500',
    error:   'bg-red-500',
    info:    'bg-blue-500',
};

const TYPE_BG: Record<string, string> = {
    warning: 'border-l-yellow-400',
    success: 'border-l-emerald-500',
    error:   'border-l-red-500',
    info:    'border-l-blue-500',
};

const NotificationsPage = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'all' | 'unread'>('unread');

    const { data: notifications = [], isLoading, refetch, isFetching } = useNotifications();
    const markAsRead  = useMarkAsRead();
    const markAllRead = useMarkAllRead();
    const deleteNotif = useDeleteNotification();

    const displayed = filter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleClick = (n: Notification) => {
        if (!n.is_read) {
            markAsRead.mutate(n.id);
        }
        if (n.link) navigate(n.link);
    };

    const handleMarkAllRead = () => {
        markAllRead.mutate(undefined, {
            onSuccess: () => toast.success('All notifications marked as read'),
        });
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteNotif.mutate(id, {
            onSuccess: () => toast.success('Notification dismissed'),
        });
    };

    return (
        <DashboardLayout title="Notifications" subtitle="Your real-time notifications — auto-updates every 5 s">
            <Card className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] flex flex-col">

                {/* Header */}
                <CardHeader className="pb-3 px-4 sm:px-6 flex-shrink-0 border-b">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-lg sm:text-xl font-bold flex flex-wrap items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            <span>Notifications</span>
                            <Badge variant="secondary">{notifications.length} total</Badge>
                            {unreadCount > 0 && (
                                <Badge variant="destructive" className="animate-pulse">
                                    {unreadCount} unread
                                </Badge>
                            )}
                        </CardTitle>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Live indicator */}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded-full">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                            </div>

                            {/* Manual refresh */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => refetch()}
                                disabled={isFetching}
                            >
                                <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
                            </Button>

                            <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
                                <TabsList className="h-8">
                                    <TabsTrigger value="all" className="text-xs sm:text-sm px-3">All</TabsTrigger>
                                    <TabsTrigger value="unread" className="text-xs sm:text-sm px-3 gap-1">
                                        Unread
                                        {unreadCount > 0 && (
                                            <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[9px] rounded-full">
                                                {unreadCount}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {unreadCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkAllRead}
                                    disabled={markAllRead.isPending}
                                    className="h-8 px-3 text-xs gap-1.5"
                                >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Mark all read
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                {/* List */}
                <CardContent className="p-0 flex-1 min-h-0">
                    <ScrollArea className="h-full">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                                <RefreshCw className="h-6 w-6 animate-spin" />
                                <p className="text-sm">Loading notifications...</p>
                            </div>
                        ) : displayed.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                                <div className="p-4 rounded-full bg-muted/50">
                                    <BellOff className="h-8 w-8 opacity-40" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">
                                        {filter === 'unread' ? "You're all caught up!" : 'No notifications yet'}
                                    </p>
                                    <p className="text-xs mt-1">
                                        {filter === 'unread' ? 'No unread notifications at the moment' : 'Notifications will appear here'}
                                    </p>
                                </div>
                                {filter === 'unread' && (
                                    <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
                                        View all notifications
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {displayed.map((n) => (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            'group relative flex items-start gap-3 px-4 py-4 cursor-pointer transition-all duration-200',
                                            'border-l-2 hover:bg-muted/40',
                                            !n.is_read
                                                ? cn('bg-primary/5', TYPE_BG[n.type] ?? 'border-l-blue-500')
                                                : 'border-l-transparent'
                                        )}
                                        onClick={() => handleClick(n)}
                                    >
                                        {/* Type dot */}
                                        <div className={cn('mt-1.5 h-2.5 w-2.5 rounded-full shrink-0', TYPE_DOT[n.type] ?? 'bg-blue-500')} />

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:justify-between">
                                                <p className={cn(
                                                    'text-sm leading-tight font-medium',
                                                    !n.is_read ? 'text-foreground' : 'text-muted-foreground'
                                                )}>
                                                    {n.title}
                                                    {!n.is_read && (
                                                        <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-primary align-middle" />
                                                    )}
                                                </p>
                                                <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap shrink-0">
                                                    {format(new Date(n.created_at), 'MMM d, yyyy · h:mm a')}
                                                </span>
                                            </div>
                                            <p className="text-xs sm:text-sm text-muted-foreground">
                                                {n.message}
                                            </p>
                                            {n.link && (
                                                <span className="inline-flex items-center gap-1 text-xs text-primary font-medium mt-1">
                                                    <ExternalLink className="h-3 w-3" />
                                                    View ticket
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions — appear on hover */}
                                        <div className="flex items-center gap-1 shrink-0 self-start pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!n.is_read && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                    title="Mark as read"
                                                    onClick={(e) => { e.stopPropagation(); markAsRead.mutate(n.id); }}
                                                >
                                                    <CheckCheck className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                onClick={(e) => handleDelete(e, n.id)}
                                                title="Delete notification"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default NotificationsPage;
