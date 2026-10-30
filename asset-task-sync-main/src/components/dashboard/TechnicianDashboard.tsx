import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MaintenanceTicket, Profile } from '@/integrations/laravel/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TicketWorkflow } from '@/components/tickets/TicketWorkflow';
import { TicketDetailsDialog } from '@/components/tickets/TicketDetailsDialog';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { ticketPriorityStyles } from '@/lib/ticket-utils';
import { format } from 'date-fns';
import {
  Wrench,
  CheckCircle,
  Clock,
  Star,
  AlertTriangle,
  Play,
  Phone,
  MapPin,
  Building2,
  Printer,
  Calendar,
  Sparkles,
  ClipboardList,
  CheckCheck,
  Eye,
  ArrowRight,
  Monitor,
  Cpu,
  Smile,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TechnicianDashboardProps {
  tickets: MaintenanceTicket[];
  profile: Profile | null;
  supportCategory: string | null;
}

export function TechnicianDashboard({
  tickets,
  profile,
  supportCategory,
}: TechnicianDashboardProps) {
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'in_progress' | 'review'>('all');

  // Categorize technician's tickets
  const {
    assignedTickets,
    inProgressTickets,
    reviewTickets,
    completedTickets,
    urgentTickets,
    avgRating,
    ratingCount,
  } = useMemo(() => {
    const assigned = tickets.filter(t => t.status === 'assigned');
    const inProgress = tickets.filter(t => t.status === 'in_progress' || t.status === 'reopened');
    const review = tickets.filter(t => t.status === 'completed_pending_review');
    const completed = tickets.filter(t => t.status === 'completed');

    const urgent = tickets.filter(
      t =>
        ['high', 'critical'].includes(t.priority) &&
        ['assigned', 'in_progress', 'reopened'].includes(t.status)
    );

    const rated = tickets.filter(t => typeof t.feedback_rating === 'number' && t.feedback_rating > 0);
    const avg =
      rated.length > 0
        ? (rated.reduce((sum, t) => sum + (t.feedback_rating || 0), 0) / rated.length).toFixed(1)
        : null;

    return {
      assignedTickets: assigned,
      inProgressTickets: inProgress,
      reviewTickets: review,
      completedTickets: completed,
      urgentTickets: urgent,
      avgRating: avg,
      ratingCount: rated.length,
    };
  }, [tickets]);

  const activeWorkloadCount = assignedTickets.length + inProgressTickets.length;
  const isAvailable = activeWorkloadCount === 0;

  // Domain label
  const domainLabel =
    supportCategory === 'sap'
      ? 'System & ERP Specialist'
      : supportCategory === 'general'
      ? 'Facility & Maintenance Specialist'
      : 'IT Support Specialist';

  // Filter active tasks
  const displayTasks = useMemo(() => {
    if (activeTab === 'assigned') return assignedTickets;
    if (activeTab === 'in_progress') return inProgressTickets;
    if (activeTab === 'review') return reviewTickets;
    // Default 'all' active: assigned + in_progress + review
    return [...inProgressTickets, ...assignedTickets, ...reviewTickets];
  }, [activeTab, assignedTickets, inProgressTickets, reviewTickets]);

  return (
    <div className="space-y-6">
      {/* ── Modern Hero Strip for Technician ── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-[#0f5766]/20 via-[#11adc4]/10 to-card p-5 sm:p-6 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#11adc4] to-[#0f5766] text-white shadow-md font-bold text-xl">
                {profile?.name?.charAt(0) || 'T'}
              </div>
              <span
                className={cn(
                  'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background',
                  isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                )}
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Welcome back, {profile?.name?.split(' ')[0] || 'Technician'}
                </h2>
                {isAvailable ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold gap-1.5 text-xs py-0.5"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Available for Dispatch
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-semibold gap-1.5 text-xs py-0.5"
                  >
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Active on {activeWorkloadCount} {activeWorkloadCount === 1 ? 'Job' : 'Jobs'}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#11adc4]" />
                <span>{domainLabel}</span>
                {profile?.department && <span>• {profile.department}</span>}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <Link to="/tickets" className="flex-1 sm:flex-initial">
              <Button size="sm" className="w-full sm:w-auto gap-2 bg-[#0f5766] hover:bg-[#11adc4] text-white shadow-xs">
                <ClipboardList className="h-4 w-4" />
                All My Tickets ({tickets.length})
              </Button>
            </Link>
            <Link to="/calendar" className="flex-1 sm:flex-initial">
              <Button size="sm" variant="outline" className="w-full sm:w-auto gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Work Schedule
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Urgent Task Notice Banner ── */}
      {urgentTickets.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-rose-300 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-card dark:border-rose-900/60 dark:bg-rose-950/20 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                {urgentTickets.length} Priority Work Order{urgentTickets.length > 1 ? 's' : ''} Need Immediate Attention
                <Badge variant="destructive" className="text-[11px] uppercase tracking-wide">
                  Urgent
                </Badge>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                High or critical priority maintenance tickets have been assigned to you.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="h-8 text-xs font-semibold gap-1.5 shrink-0"
            onClick={() => setSelectedTicket(urgentTickets[0])}
          >
            <Play className="h-3 w-3" />
            Inspect Urgent Task
          </Button>
        </div>
      )}

      {/* ── Personal KPI Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Needs Start */}
        <div
          onClick={() => setActiveTab('assigned')}
          className={cn(
            'group relative overflow-hidden rounded-2xl border p-4 sm:p-4.5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-4 border-t-amber-500 bg-card',
            activeTab === 'assigned' ? 'ring-2 ring-amber-500 bg-amber-50/20 dark:bg-amber-950/20' : 'border-border/70'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Assigned</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ClipboardList className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{assignedTickets.length}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">Ready to start work</p>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setActiveTab('in_progress')}
          className={cn(
            'group relative overflow-hidden rounded-2xl border p-4 sm:p-4.5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-4 border-t-[#11adc4] bg-card',
            activeTab === 'in_progress' ? 'ring-2 ring-[#11adc4] bg-[#11adc4]/5 dark:bg-[#11adc4]/10' : 'border-border/70'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In Progress</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#11adc4]/10 text-[#0f5766] dark:text-[#38d8ef]">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{inProgressTickets.length}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">Under active repair</p>
        </div>

        {/* Pending Review */}
        <div
          onClick={() => setActiveTab('review')}
          className={cn(
            'group relative overflow-hidden rounded-2xl border p-4 sm:p-4.5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border-t-4 border-t-blue-500 bg-card',
            activeTab === 'review' ? 'ring-2 ring-blue-500 bg-blue-50/20 dark:bg-blue-950/20' : 'border-border/70'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Under Review</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{reviewTickets.length}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">Awaiting QA approval</p>
        </div>

        {/* Completed */}
        <div
          className="group relative overflow-hidden rounded-2xl border p-4 sm:p-4.5 border-t-4 border-t-emerald-500 bg-card border-border/70"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{completedTickets.length}</p>
          <p className="text-xs text-muted-foreground mt-1 truncate">Successfully closed</p>
        </div>

        {/* Quality Rating */}
        <div className="group relative overflow-hidden rounded-2xl border p-4 sm:p-4.5 border-t-4 border-t-violet-500 bg-card border-border/70 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Performance QA</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {avgRating ? `${avgRating}` : '5.0'}
            </p>
            <span className="text-xs text-muted-foreground">/ 5.0</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {ratingCount > 0 ? `${ratingCount} rated jobs` : 'High performance rating'}
          </p>
        </div>
      </div>

      {/* ── Active Workboard Section ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              My Active Workboard
            </h3>
            <p className="text-xs sm:text-[13px] text-muted-foreground mt-0.5">
              Tasks assigned to you that require inspection, repair, or progress updates
            </p>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-lg border border-border/60 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                activeTab === 'all' ? 'bg-background shadow-2xs font-semibold text-foreground' : 'text-muted-foreground'
              )}
            >
              All Active ({assignedTickets.length + inProgressTickets.length + reviewTickets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('assigned')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                activeTab === 'assigned' ? 'bg-background shadow-2xs font-semibold text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
              )}
            >
              New ({assignedTickets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('in_progress')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                activeTab === 'in_progress' ? 'bg-background shadow-2xs font-semibold text-[#11adc4]' : 'text-muted-foreground'
              )}
            >
              In Progress ({inProgressTickets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('review')}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium transition-colors',
                activeTab === 'review' ? 'bg-background shadow-2xs font-semibold text-blue-600' : 'text-muted-foreground'
              )}
            >
              Review ({reviewTickets.length})
            </button>
          </div>
        </div>

        {/* Task Cards Grid */}
        {displayTasks.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/60">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-3">
              <CheckCheck className="h-7 w-7" />
            </div>
            <h4 className="text-base font-bold text-foreground">You are all caught up!</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
              There are no tasks currently pending in this section. Your status is set to{' '}
              <strong className="text-emerald-600 font-semibold">Available for Dispatch</strong>. You will be notified
              as soon as a manager routes a new ticket to you.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayTasks.map((ticket) => {
              const priority = ticketPriorityStyles[ticket.priority] || ticketPriorityStyles.medium;
              const isUrgent = ['high', 'critical'].includes(ticket.priority);

              return (
                <Card
                  key={ticket.id}
                  className={cn(
                    'group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card transition-all duration-200 hover:shadow-md border-t-4',
                    isUrgent ? 'border-t-rose-500 shadow-rose-500/5' : 'border-t-primary',
                    ticket.status === 'assigned'
                      ? 'border-amber-300/60 dark:border-amber-800/40'
                      : 'border-border/70'
                  )}
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col gap-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-primary">
                            #{ticket.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                              priority.badge
                            )}
                          >
                            <span className={cn('h-1.5 w-1.5 rounded-full', priority.dot)} />
                            {ticket.priority}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {ticket.title}
                        </h4>
                      </div>
                      <TicketStatusBadge status={ticket.status} className="shrink-0 text-[10px]" />
                    </div>

                    {/* Description preview */}
                    {ticket.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {ticket.description}
                      </p>
                    )}

                    {/* Equipment & Requester Info */}
                    <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
                      {/* Asset / Equipment */}
                      {ticket.asset && (
                        <div className="flex items-center justify-between gap-2 text-muted-foreground">
                          <span className="flex items-center gap-1.5 truncate text-foreground/90 font-medium">
                            <Monitor className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{ticket.asset.name}</span>
                          </span>
                          {ticket.asset.serial_number && (
                            <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                              SN: {ticket.asset.serial_number}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Requester Contact */}
                      <div className="flex items-center justify-between gap-2 text-muted-foreground">
                        <span className="flex items-center gap-1.5 truncate">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                          <span className="truncate">
                            {ticket.requester?.name || 'Staff Requester'}
                            {ticket.requester?.department ? ` • ${ticket.requester.department}` : ''}
                          </span>
                        </span>

                        {ticket.requester?.phone && (
                          <a
                            href={`tel:${ticket.requester.phone}`}
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-[11px] shrink-0"
                            title="Call requester"
                          >
                            <Phone className="h-3 w-3" />
                            {ticket.requester.phone}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Workflow Action Bar */}
                    <div className="pt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                          asChild
                        >
                          <Link to={`/tickets/${ticket.id}/print`}>
                            <Printer className="h-3.5 w-3.5 mr-1" />
                            Slip
                          </Link>
                        </Button>
                      </div>

                      {/* Direct action button depending on ticket status */}
                      <TicketWorkflow ticket={ticket} compact={true} showCancel={false} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recent Closed Work Section ── */}
      {completedTickets.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Recently Completed Work
            </h3>
            <Link to="/tickets" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              View All History <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-4">Ticket</th>
                    <th className="py-2.5 px-4">Asset / Equipment</th>
                    <th className="py-2.5 px-4">Duration</th>
                    <th className="py-2.5 px-4">Completed On</th>
                    <th className="py-2.5 px-4">Performance Rating</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {completedTickets.slice(0, 5).map((t) => (
                    <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-foreground">
                        <span className="font-mono text-[10px] text-muted-foreground mr-1.5">
                          #{t.id.slice(0, 8)}
                        </span>
                        {t.title}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {t.asset?.name || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {t.actual_duration ? `${t.actual_duration} mins` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {t.completed_date ? format(new Date(t.completed_date), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        {t.feedback_rating ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                            {t.feedback_rating}.0
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-primary"
                          onClick={() => setSelectedTicket(t)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Dialog */}
      <TicketDetailsDialog
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null);
        }}
      />
    </div>
  );
}
