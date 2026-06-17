import { useActivityLogs } from '@/hooks/useActivityLogs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const actionColors = {
  created: 'bg-success',
  started: 'bg-info',
  completed: 'bg-accent',
  updated: 'bg-warning',
  deleted: 'bg-destructive',
};

const RecentActivity = () => {
  const { data: logs, isLoading } = useActivityLogs();

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {logs && logs.length > 0 ? (
          logs.map((log, index) => (
            <div
              key={log.id}
              className={cn(
                'flex items-start gap-3 animate-slide-up',
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-muted text-xs font-medium">
                    {log.user?.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                    actionColors[log.action as keyof typeof actionColors] || 'bg-muted'
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{log.user?.name}</span>
                  <span className="text-muted-foreground"> {log.action} </span>
                  <span className="font-medium">{log.entity_type}</span>
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {log.details}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No recent activity found.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
