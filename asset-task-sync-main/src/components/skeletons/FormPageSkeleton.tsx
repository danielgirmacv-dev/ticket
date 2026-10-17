import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function FormPageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in-50 duration-300">
      <Card className="border border-border/60 shadow-lg overflow-hidden border-t-4 border-t-teal-600">
        <CardHeader className="p-6 pb-4 space-y-2 border-b border-border/40">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Support Category Selector (3 cards) */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-border/50 space-y-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>

          {/* Upload attachment area */}
          <div className="p-6 border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>

          {/* Submit Button */}
          <Skeleton className="h-12 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}
