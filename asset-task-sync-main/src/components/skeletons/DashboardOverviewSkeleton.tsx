import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300">
      {/* Stats Row - 6 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border border-border/70 shadow-xs overflow-hidden rounded-xl">
            <CardContent className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-10 rounded-xl" />
              </div>
              <Skeleton className="h-8 w-14" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row - 3 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border border-border/70 shadow-xs p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3.5 w-16" />
            </div>
            <div className="flex items-center justify-center h-48">
              <Skeleton className="h-36 w-36 rounded-full" />
            </div>
            <div className="flex justify-center gap-3 mt-4">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          </Card>
        ))}

        {/* Full-width Monthly Chart */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 border border-border/70 shadow-xs p-5 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3.5 w-28" />
            </div>
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
          <div className="h-56 flex items-end justify-between gap-2 pt-6 px-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton
                  className="w-full rounded-t-sm"
                  style={{ height: `${25 + ((i * 19) % 65)}%` }}
                />
                <Skeleton className="h-2.5 w-6" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Content Row: Tickets overview (2 cols) + Recent activity (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <Card className="lg:col-span-2 border border-border/60 shadow-sm">
          <CardHeader className="p-4 border-b border-border/40 flex flex-row items-center justify-between">
            <Skeleton className="h-4 w-36" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          </CardHeader>
          <CardContent className="p-4 divide-y divide-border/40 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="p-4 border-b border-border/40">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
