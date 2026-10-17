import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { DashboardOverviewSkeleton } from './DashboardOverviewSkeleton';
import { CardsPageSkeleton } from './CardsPageSkeleton';
import { TablePageSkeleton } from './TablePageSkeleton';
import { FormPageSkeleton } from './FormPageSkeleton';
import { CalendarSkeleton } from './CalendarSkeleton';
import { ReportsSkeleton } from './ReportsSkeleton';
import { NotificationsSkeleton } from './NotificationsSkeleton';
import { SchedulesSkeleton } from './SchedulesSkeleton';

export function DashboardLayoutSkeleton() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';

  // If loading the auth page
  if (path === '/auth') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Card className="w-full max-w-md p-8 border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl bg-slate-700/60" />
            <Skeleton className="h-6 w-36 bg-slate-700/60" />
            <Skeleton className="h-4 w-48 bg-slate-700/60" />
          </div>
          <div className="space-y-4 pt-4">
            <Skeleton className="h-11 w-full rounded-xl bg-slate-700/60" />
            <Skeleton className="h-11 w-full rounded-xl bg-slate-700/60" />
            <Skeleton className="h-11 w-full rounded-xl bg-teal-500/40" />
          </div>
        </Card>
      </div>
    );
  }

  // Determine which content skeleton matches the incoming screen
  const renderContentSkeleton = () => {
    if (path.startsWith('/tickets')) {
      return <CardsPageSkeleton cardsCount={6} hasTabs={true} />;
    }
    if (path.startsWith('/users')) {
      return <TablePageSkeleton statCardsCount={5} columnsCount={7} rowsCount={7} />;
    }
    if (path.startsWith('/assets')) {
      return <CardsPageSkeleton cardsCount={6} hasTabs={false} />;
    }
    if (path.startsWith('/requests')) {
      return <FormPageSkeleton />;
    }
    if (path.startsWith('/calendar')) {
      return <CalendarSkeleton />;
    }
    if (path.startsWith('/reports')) {
      return <ReportsSkeleton />;
    }
    if (path.startsWith('/notifications')) {
      return <NotificationsSkeleton />;
    }
    if (path.startsWith('/schedules')) {
      return <SchedulesSkeleton />;
    }
    if (
      path.startsWith('/locations') ||
      path.startsWith('/departments') ||
      path.startsWith('/activity-logs') ||
      path.startsWith('/faqs')
    ) {
      return <TablePageSkeleton statCardsCount={0} columnsCount={5} rowsCount={6} />;
    }
    if (path.startsWith('/settings')) {
      return (
        <div className="max-w-4xl space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
          <Card className="p-6 border border-border/60 shadow-sm space-y-6">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-4 max-w-lg">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </Card>
        </div>
      );
    }

    // Default to Dashboard Overview
    return <DashboardOverviewSkeleton />;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Skeleton (matching desktop sidebar: w-64) */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r border-border bg-card p-4 space-y-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-2 py-1">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>

        {/* Navigation Items (10 items) */}
        <div className="flex-1 space-y-2 py-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <Skeleton className="h-5 w-5 rounded shrink-0" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>

        {/* User Profile Footer */}
        <div className="pt-4 border-t border-border flex items-center gap-3 px-2">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 min-w-0 lg:ml-64">
        {/* Top Header Skeleton (matching h-16) */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 sm:px-6">
          <div className="space-y-1">
            <Skeleton className="h-5 w-36 sm:w-48" />
            <Skeleton className="h-3 w-24 sm:w-32 hidden sm:block" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-6 max-w-full">
          {renderContentSkeleton()}
        </main>
      </div>
    </div>
  );
}
