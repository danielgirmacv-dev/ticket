import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import laravelClient, { Notification } from '@/integrations/laravel/client';
import { format } from 'date-fns';
import { CheckCheck, Bell, Trash2, ExternalLink } from 'lucide-react';

const typeColorMap: Record<string, string> = {
    warning: 'bg-yellow-400',
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
};

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = filter === 'unread' ? { is_read: false } : {};
            const response = await laravelClient.get('/notifications', { params });
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleNotificationClick = async (notification: Notification) => {
        try {
            if (!notification.is_read) {
                await laravelClient.put(`/notifications/${notification.id}`, { is_read: true });
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
                );
            }
            if (notification.link) {
                navigate(notification.link);
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            const unread = notifications.filter(n => !n.is_read);
            await Promise.all(unread.map(n =>
                laravelClient.put(`/notifications/${n.id}`, { is_read: true })
            ));
        } catch (error) {
            console.error('Error marking all as read:', error);
            fetchNotifications();
        }
    };

    const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        try {
            await laravelClient.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <DashboardLayout
            title="Notifications"
            subtitle="View and manage your notifications"
        >
            <Card className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-12rem)] flex flex-col">
                {/* Card Header — stacks vertically on mobile */}
                <CardHeader className="pb-3 px-4 sm:px-6 flex-shrink-0">
                    {/* Title + badges row */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-lg sm:text-xl font-bold flex flex-wrap items-center gap-2">
                            <Bell className="h-5 w-5 flex-shrink-0" />
                            <span>Notifications</span>
                            <Badge variant="secondary">{notifications.length}</Badge>
                            {unreadCount > 0 && (
                                <Badge variant="default">{unreadCount} unread</Badge>
                            )}
                        </CardTitle>

                        {/* Controls — full width on mobile */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
                                <TabsList className="h-8">
                                    <TabsTrigger value="all" className="text-xs sm:text-sm px-3">All</TabsTrigger>
                                    <TabsTrigger value="unread" className="text-xs sm:text-sm px-3">Unread</TabsTrigger>
                                </TabsList>
                            </Tabs>
                            {notifications.some(n => !n.is_read) && (
                                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs sm:text-sm h-8 px-2 sm:px-3">
                                    <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                                    Mark all read
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 flex-1 min-h-0">
                    <ScrollArea className="h-full">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                Loading notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
                            </div>
                        ) : (
                            <div className="divide-y">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`flex items-start gap-3 p-3 sm:p-4 transition-colors hover:bg-muted/50 cursor-pointer ${
                                            !notification.is_read ? 'bg-muted/20' : ''
                                        }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        {/* Type dot */}
                                        <div className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${typeColorMap[notification.type] ?? 'bg-blue-500'}`} />

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
                                                <p className={`text-sm font-medium leading-tight ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            {notification.link && (
                                                <span className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                                                    <ExternalLink className="h-3 w-3" /> View ticket
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0 self-center">
                                            {!notification.is_read && (
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
                                                onClick={(e) => handleDelete(e, notification.id)}
                                                title="Delete notification"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

export default Notifications;
