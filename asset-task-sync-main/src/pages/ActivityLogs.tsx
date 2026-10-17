import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { format } from 'date-fns';
import { Loader2, ScrollText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ActivityLogs = () => {
    const { data: logs, isLoading } = useActivityLogs();

    if (isLoading) {
        return (
            <DashboardLayout title="Activity Logs" subtitle="System audit trail">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ScrollText className="h-5 w-5 text-muted-foreground" />
                            <Skeleton className="h-5 w-40" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-muted/20">
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-3/4 max-w-md" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                    <Skeleton className="h-3 w-28 shrink-0" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Activity Logs" subtitle="System audit trail">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ScrollText className="h-5 w-5" />
                        Recent Activity ({logs?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {logs?.map((log) => (
                            <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-muted/30">
                                <div>
                                    <p className="text-sm font-medium">{log.details}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {log.user?.name || 'System'} · {log.action} · {log.entity_type}
                                    </p>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                                </span>
                            </div>
                        ))}
                        {(!logs || logs.length === 0) && (
                            <p className="text-center text-muted-foreground py-8">No activity logs yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default ActivityLogs;
