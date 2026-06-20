import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import laravelClient, { Notification } from '@/integrations/laravel/client';
import { format } from 'date-fns';
import { CheckCheck, Bell, Trash2 } from 'lucide-react';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const fetchNotifications = async () => {
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
    };

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

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
            <Card className="h-[calc(100vh-12rem)]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                        <Badge variant="secondary" className="ml-2">
                            {notifications.length}
                        </Badge>
                        {unreadCount > 0 && (
                            <Badge variant="default" className="ml-1">
                                {unreadCount} unread
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="unread">Unread</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {notifications.some(n => !n.is_read) && (
                            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                                <CheckCheck className="mr-2 h-4 w-4" />
                                Mark all read
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-16rem)]">
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
                                        className={`flex items-start gap-4 p-4 transition-colors hover:bg-muted/50 cursor-pointer ${!notification.is_read ? 'bg-muted/20' : ''
                                            }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className={`mt-1.5 h-3 w-3 rounded-full shrink-0 ${notification.type === 'warning' ? 'bg-warning' :
                                                notification.type === 'success' ? 'bg-success' :
                                                    notification.type === 'error' ? 'bg-destructive' : 'bg-info'
                                            }`} />

                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {notification.title}
                                                </p>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                    {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {!notification.is_read && (
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={(e) => handleDelete(e, notification.id)}
                                                title="Delete notification"
                                            >
                                                <Trash2 className="h-4 w-4" />
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
