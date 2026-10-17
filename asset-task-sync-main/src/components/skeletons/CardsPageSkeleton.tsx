import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface CardsPageSkeletonProps {
  cardsCount?: number;
  hasTabs?: boolean;
  hasFilters?: boolean;
}

export function CardsPageSkeleton({
  cardsCount = 6,
  hasTabs = true,
  hasFilters = true,
}: CardsPageSkeletonProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Search & Filter Toolbar */}
      {hasFilters && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-2 max-w-xl">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      )}

      {/* Tabs Row (e.g. All, Submitted, Approved, In Progress, Completed) */}
      {hasTabs && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-lg shrink-0" />
          ))}
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: cardsCount }).map((_, i) => (
          <Card key={i} className="border border-border/60 shadow-sm overflow-hidden flex flex-col justify-between">
            <CardHeader className="p-4 pb-3 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-20 rounded" />
                  <Skeleton className="h-5 w-4/5" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              </div>
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
              </div>
              <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
