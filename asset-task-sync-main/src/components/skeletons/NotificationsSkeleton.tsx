import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function NotificationsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Filter Tabs + Action */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 sm:w-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      {/* Notifications List */}
      <Card className="border border-border/60 shadow-sm divide-y divide-border/40 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardContent key={i} className="p-4 flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-3 w-3 rounded-full mt-2" />
          </CardContent>
        ))}
      </Card>
    </div>
  );
}
