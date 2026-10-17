import { useState } from 'react';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';

const actionColors: Record<string, string> = {
  created: 'bg-emerald-500 shadow-xs shadow-emerald-500/50',
  started: 'bg-[#11adc4] shadow-xs shadow-[#11adc4]/50',
  completed: 'bg-teal-500 shadow-xs shadow-teal-500/50',
  updated: 'bg-amber-500 shadow-xs shadow-amber-500/50',
  deleted: 'bg-rose-500 shadow-xs shadow-rose-500/50',
};

const ITEMS_PER_PAGE = 5;

const RecentActivity = () => {
  const { data: logs, isLoading } = useActivityLogs();
  const [currentPage, setCurrentPage] = useState(1);

  if (isLoading) {
    return (
      <Card className="h-full border border-border/80 shadow-sm border-t-2 border-t-[#0f5766]">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalLogs = logs?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalLogs / ITEMS_PER_PAGE));
  const currentLogs = logs?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) || [];

  return (
    <Card className="h-full flex flex-col justify-between border border-border/80 shadow-xs border-t-2 border-t-[#0f5766] overflow-hidden">
      <div>
        <CardHeader className="pb-3.5 flex flex-row items-center justify-between bg-muted/20 border-b border-border/40">
          <div>
            <CardTitle className="text-[18px] font-bold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#11adc4]" />
              Audit Trail
            </CardTitle>
            <CardDescription className="text-[13px] text-muted-foreground mt-0.5">Recent system events</CardDescription>
          </div>
          {totalLogs > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {currentLogs.length > 0 ? (
            currentLogs.map((log, index) => (
              <div
                key={log.id}
                className={cn('flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors duration-150 animate-slide-up')}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="relative shrink-0 mt-0.5">
                  <Avatar className="h-9 w-9 border border-border/60">
                    <AvatarFallback className="bg-gradient-to-br from-[#11adc4]/20 to-[#0f5766]/20 text-[#0f5766] dark:text-[#38d8ef] text-xs font-bold">
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
                  <p className="text-[14px] leading-snug">
                    <span className="font-bold text-foreground">{log.user?.name || 'System'}</span>
                    <span className="text-muted-foreground"> {log.action} </span>
                    <span className="font-semibold text-primary">{log.entity_type}</span>
                  </p>
                  <p className="text-[13px] text-muted-foreground truncate mt-0.5">
                    {log.details}
                  </p>
                  <p className="text-[11px] font-medium text-muted-foreground/75 mt-1">
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
        <div className="p-3.5 flex items-center justify-between border-t border-border/40 mt-3 text-xs bg-muted/10">
          <span className="text-muted-foreground font-medium">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalLogs)} of {totalLogs}
          </span>
          <div className="flex items-center gap-1.5">
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
