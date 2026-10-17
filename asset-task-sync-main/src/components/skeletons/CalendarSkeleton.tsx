import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in-50 duration-300">
      {/* Main Calendar View (3 cols) */}
      <Card className="lg:col-span-3 border border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b border-border/40 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-36" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </CardHeader>
        <CardContent className="p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center">
                <Skeleton className="h-4 w-8 mx-auto" />
              </div>
            ))}
          </div>
          {/* 5-week Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="min-h-[75px] sm:min-h-[90px] p-2 border border-border/40 rounded-lg flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <Skeleton className="h-4 w-5 rounded" />
                  {i % 5 === 0 && <Skeleton className="h-2 w-2 rounded-full" />}
                </div>
                {i % 4 === 1 && (
                  <Skeleton className="h-5 w-full rounded text-xs px-1" />
                )}
                {i % 6 === 2 && (
                  <Skeleton className="h-5 w-full rounded text-xs px-1" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Side Panel: Selected Day Events */}
      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="p-4 border-b border-border/40">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3.5 w-24" />
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg border border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
