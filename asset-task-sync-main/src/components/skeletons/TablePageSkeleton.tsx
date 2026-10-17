import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface TablePageSkeletonProps {
  statCardsCount?: number;
  columnsCount?: number;
  rowsCount?: number;
  hasFilters?: boolean;
}

export function TablePageSkeleton({
  statCardsCount = 0,
  columnsCount = 6,
  rowsCount = 7,
  hasFilters = true,
}: TablePageSkeletonProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Optional Top Stats */}
      {statCardsCount > 0 && (
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-${Math.min(statCardsCount, 5)} gap-3 sm:gap-4`}>
          {Array.from({ length: statCardsCount }).map((_, i) => (
            <Card key={i} className="border border-border/60 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                </div>
                <Skeleton className="h-7 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter / Search Bar */}
      {hasFilters && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-2 max-w-2xl">
            <Skeleton className="h-10 flex-1 min-w-[200px] rounded-lg" />
            <Skeleton className="h-10 w-28 sm:w-32 rounded-lg" />
            <Skeleton className="h-10 w-28 sm:w-32 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
      )}

      {/* Table Card Skeleton */}
      <Card className="border border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                {Array.from({ length: columnsCount }).map((_, i) => (
                  <th key={i} className="p-3 text-left">
                    <Skeleton className="h-3 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {Array.from({ length: rowsCount }).map((_, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-muted/10 transition-colors">
                  {/* First column: avatar + name & subtext */}
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-2.5 w-36" />
                      </div>
                    </div>
                  </td>

                  {/* Middle columns */}
                  {Array.from({ length: columnsCount - 2 }).map((_, colIdx) => (
                    <td key={colIdx} className="p-3">
                      {colIdx % 2 === 0 ? (
                        <Skeleton className="h-5 w-20 rounded-full" />
                      ) : (
                        <Skeleton className="h-3.5 w-24" />
                      )}
                    </td>
                  ))}

                  {/* Action Column */}
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Skeleton className="h-8 w-16 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
