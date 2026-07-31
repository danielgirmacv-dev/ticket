import { useState } from 'react';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const actionColors = {
  created: 'bg-success',
  started: 'bg-info',
  completed: 'bg-accent',
  updated: 'bg-warning',
  deleted: 'bg-destructive',
};

const ITEMS_PER_PAGE = 5;

const RecentActivity = () => {
  const { data: logs, isLoading } = useActivityLogs();
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalLogs = logs?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalLogs / ITEMS_PER_PAGE));
  const currentLogs = logs?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) || [];

  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          {totalLogs > 0 && (
            <span className="text-xs text-muted-foreground font-medium">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {currentLogs.length > 0 ? (
            currentLogs.map((log, index) => (
              <div
                key={log.id}
                className={cn('flex items-start gap-3 animate-slide-up')}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-muted text-xs font-medium">
                      {log.user?.name ? log.user.name.split(' ').map(n => n[0]).join('') : 'U'}
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
                    <span className="font-medium">{log.user?.name || 'System'}</span>
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
      </div>

      {totalPages > 1 && (
        <div className="p-4 pt-0 flex items-center justify-between border-t border-border/40 mt-3 text-xs">
          <span className="text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalLogs)} of {totalLogs}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default RecentActivity;
