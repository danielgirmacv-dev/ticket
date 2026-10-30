import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import TicketsOverview from '@/components/dashboard/TicketsOverview';
import TopTechnicians from '@/components/dashboard/TopTechnicians';
import { TicketStatusChart, AssetTypeChart, MonthlyTicketsChart } from '@/components/dashboard/Charts';
import { TechnicianDashboard } from '@/components/dashboard/TechnicianDashboard';

import { Button } from '@/components/ui/button';
import {
  Monitor, ClipboardList, Clock, CheckCircle, Wrench,
  Loader2, Plus, Building2, Cpu, HardHat, LayoutDashboard,
  ShieldCheck, Users, BarChart3,
} from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';
import { useTickets } from '@/hooks/useTickets';
import { useAuth } from '@/hooks/useAuth';
import { DashboardOverviewSkeleton } from '@/components/skeletons/DashboardOverviewSkeleton';

/* ─────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Derive a display-friendly label for the manager's domain */
function domainLabel(category: string | null) {
  if (category === 'general') return 'Facility';
  if (category === 'sap') return 'System & ERP';
  return 'IT Support';
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Sub-views                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

/** Banner rendered inside the quick-action strip – differs per domain */
function DomainBanner({
  category,
  role,
}: {
  category: string | null;
  role: string | null;
}) {
  const isFacility = category === 'general';
  const isSap = category === 'sap';
  const isSuperAdmin = role === 'super_admin';

  if (isSuperAdmin) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#0f5766]/15 via-[#11adc4]/10 to-card border border-[#11adc4]/30 shadow-xs">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#11adc4] shadow-xs shadow-[#11adc4]/50 animate-pulse" />
            Operational Overview — All Departments
          </h3>
          <p className="text-xs sm:text-[13px] text-muted-foreground mt-0.5">
            Full visibility across IT, Facility, and System & ERP operations
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
          <Link to="/tickets"><Button size="sm" variant="default" className="gap-1.5 shadow-md h-9 text-xs font-semibold"><Plus className="h-4 w-4" />Issue Ticket</Button></Link>
          <Link to="/assets"><Button size="sm" variant="accent" className="gap-1.5 shadow-md h-9 text-xs font-semibold"><Monitor className="h-4 w-4" />Assets</Button></Link>
          <Link to="/users"><Button size="sm" variant="secondary" className="gap-1.5 shadow-md h-9 text-xs font-semibold"><Users className="h-4 w-4" />Users</Button></Link>
          <Link to="/reports"><Button size="sm" variant="outline" className="gap-1.5 shadow-md h-9 text-xs font-semibold"><BarChart3 className="h-4 w-4" />Reports</Button></Link>
        </div>
      </div>
    );
  }

  if (isFacility) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-900/15 via-emerald-700/10 to-card border border-emerald-600/30 shadow-xs">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50 animate-pulse" />
            <Building2 className="h-4 w-4 text-emerald-500" />
            Facility Operations Dashboard
          </h3>
          <p className="text-xs sm:text-[13px] text-muted-foreground mt-0.5">
            Workplace maintenance, facility requests, and your technician team
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
          <Link to="/tickets"><Button size="sm" className="gap-1.5 shadow-md h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border-0"><Plus className="h-4 w-4" />New Work Order</Button></Link>
          <Link to="/assets"><Button size="sm" variant="accent" className="gap-1.5 shadow-md h-9 text-xs font-semibold"><Monitor className="h-4 w-4" />Assets</Button></Link>
          <Link to="/requests"><Button size="sm" variant="secondary" className="gap-1.5 shadow-md h-9 text-xs font-semibold"><HardHat className="h-4 w-4" />Requests</Button></Link>
          <Link to="/schedules"><Button size="sm" variant="outline" className="gap-1.5 shadow-md h-9 text-xs font-semibold"><Clock className="h-4 w-4" />Schedules</Button></Link>
          <Link to="/users"><Button size="sm" variant="outline" className="gap-1.5 shadow-md h-9 text-xs font-semibold"><Users className="h-4 w-4" />My Team</Button></Link>
        </div>
      </div>
    );
  }

  if (isSap) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-violet-900/15 via-violet-700/10 to-card border border-violet-600/30 shadow-xs">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-violet-500 shadow-xs shadow-violet-500/50 animate-pulse" />
            <Cpu className="h-4 w-4 text-violet-500" />
            System &amp; ERP Support Dashboard
          </h3>
          <p className="text-xs sm:text-[13px] text-muted-foreground mt-0.5">
            Enterprise systems, ERP tickets, user access requests, and your support team
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
          <Link to="/tickets"><Button size="sm" className="gap-1.5 shadow-md h-9 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white border-0"><Plus className="h-4 w-4" />New Ticket</Button></Link>
          <Link to="/assets"><Button size="sm" variant="accent" className="gap-1.5 shadow-md h-9 text-xs font-semibold"><Monitor className="h-4 w-4" />Assets</Button></Link>
          <Link to="/users"><Button size="sm" variant="outline" className="gap-1.5 shadow-md h-9 text-xs font-semibold"><Users className="h-4 w-4" />My Team</Button></Link>
        </div>
      </div>
    );
  }

  // Default: IT Support
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#0f5766]/15 via-[#11adc4]/10 to-card border border-[#11adc4]/30 shadow-xs">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#11adc4] shadow-xs shadow-[#11adc4]/50 animate-pulse" />
          <Cpu className="h-4 w-4 text-[#11adc4]" />
          IT Support Dashboard
        </h3>
        <p className="text-xs sm:text-[13px] text-muted-foreground mt-0.5">
          Hardware assets, support tickets, and your IT technician team
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
        <Link to="/tickets"><Button size="sm" variant="default" className="gap-1.5 shadow-md h-9 text-xs font-semibold"><Plus className="h-4 w-4" />Issue Ticket</Button></Link>
        <Link to="/assets"><Button size="sm" variant="accent" className="gap-1.5 shadow-md h-9 text-xs font-semibold"><Monitor className="h-4 w-4" />Assets</Button></Link>
        <Link to="/requests"><Button size="sm" variant="secondary" className="gap-1.5 shadow-md h-9 text-xs font-semibold"><Wrench className="h-4 w-4" />Requests</Button></Link>
        <Link to="/users"><Button size="sm" variant="outline" className="gap-1.5 shadow-md h-9 text-xs font-semibold"><Users className="h-4 w-4" />My Team</Button></Link>
      </div>
    </div>
  );
}

/* Domain-specific accent colours for stat cards */
function accentFor(category: string | null, role: string | null) {
  if (role === 'super_admin') return { primary: '#11adc4', topBorder: 'border-t-[#11adc4]' };
  if (category === 'general') return { primary: '#10B981', topBorder: 'border-t-emerald-500' };
  if (category === 'sap') return { primary: '#7C3AED', topBorder: 'border-t-violet-500' };
  return { primary: '#11adc4', topBorder: 'border-t-[#11adc4]' };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Page                                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

const Index = () => {
  const { role, supportCategory, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: assets, isLoading: assetsLoading } = useAssets();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();

  useEffect(() => {
    if (!authLoading && role === 'requester') {
      navigate('/requests');
    }
  }, [role, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isLoading = assetsLoading || ticketsLoading;

  /* Derive friendly page title and subtitle */
  const isFacility = supportCategory === 'general';
  const isSuperAdmin = role === 'super_admin';
  const isTechnician = role === 'technician';
  const label = domainLabel(supportCategory);

  const pageTitle = isSuperAdmin
    ? 'Dashboard'
    : isTechnician
      ? 'My Workboard'
      : `${label} Manager Dashboard`;

  const pageSubtitle = isSuperAdmin
    ? 'Full operational visibility across all support departments'
    : isTechnician
      ? `Welcome back, ${profile?.name?.split(' ')[0] ?? 'Technician'}. Here are your assigned tasks.`
      : `Welcome back. Here's your ${label.toLowerCase()} team overview.`;

  if (isLoading) {
    return (
      <DashboardLayout title={pageTitle} subtitle={pageSubtitle}>
        <DashboardOverviewSkeleton />
      </DashboardLayout>
    );
  }

  if (isTechnician) {
    return (
      <DashboardLayout title={pageTitle} subtitle={pageSubtitle}>
        <TechnicianDashboard
          tickets={tickets || []}
          profile={profile}
          supportCategory={supportCategory}
        />
      </DashboardLayout>
    );
  }

  /* ── Stats ── */
  const totalAssets = assets?.length || 0;
  const activeAssets = assets?.filter(a => a.status === 'active').length || 0;

  const totalTickets = tickets?.length || 0;
  const pendingTickets = tickets?.filter(t => t.status === 'submitted').length || 0;
  const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0;
  const completedTickets = tickets?.filter(t => t.status === 'completed').length || 0;

  return (
    <DashboardLayout title={pageTitle} subtitle={pageSubtitle}>
      <div className="space-y-5">

        {/* Domain Banner */}
        <DomainBanner category={supportCategory} role={role} />

        {/* ── Facility-specific domain badge ── */}
        {isFacility && !isSuperAdmin && (
          <div className="flex items-center gap-2 px-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3 py-0.5">
              <Building2 className="h-3 w-3" />
              Facility &amp; Maintenance Operations
            </span>
          </div>
        )}

        {/* ── IT-specific domain badge ── */}
        {!isFacility && !isSuperAdmin && supportCategory === 'it_support' && (
          <div className="flex items-center gap-2 px-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#11adc4] bg-[#11adc4]/10 border border-[#11adc4]/25 rounded-full px-3 py-0.5">
              <Cpu className="h-3 w-3" />
              Information Technology Support
            </span>
          </div>
        )}

        {/* ── System & ERP badge ── */}
        {!isFacility && !isSuperAdmin && supportCategory === 'sap' && (
          <div className="flex items-center gap-2 px-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-violet-500 bg-violet-500/10 border border-violet-500/25 rounded-full px-3 py-0.5">
              <LayoutDashboard className="h-3 w-3" />
              System &amp; ERP Support Team
            </span>
          </div>
        )}

        {/* ── Super Admin badge ── */}
        {isSuperAdmin && (
          <div className="flex items-center gap-2 px-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/25 rounded-full px-3 py-0.5">
              <ShieldCheck className="h-3 w-3" />
              Super Admin — Full Access
            </span>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          <Link to="/assets" className="block focus:outline-none">
            <StatCard title="Total Assets" value={totalAssets} icon={<Monitor className="h-5 w-5" />} subtitle="Hardware & equipment" variant="primary" />
          </Link>
          <Link to="/assets?status=active" className="block focus:outline-none">
            <StatCard title="Active Assets" value={activeAssets} icon={<CheckCircle className="h-5 w-5" />} subtitle="Currently operational" variant="success" />
          </Link>
          <Link to="/tickets" className="block focus:outline-none">
            <StatCard title="Total Tickets" value={totalTickets} icon={<ClipboardList className="h-5 w-5" />} subtitle={isFacility ? 'All work orders' : 'All logged tickets'} variant="secondary" />
          </Link>
          <Link to="/tickets?status=pending" className="block focus:outline-none">
            <StatCard title="Pending" value={pendingTickets} icon={<Clock className="h-5 w-5" />} subtitle={isFacility ? 'Awaiting dispatch' : 'Awaiting technician'} variant="warning" />
          </Link>
          <Link to="/tickets?status=in_progress" className="block focus:outline-none">
            <StatCard title="In Progress" value={inProgressTickets} icon={<Wrench className="h-5 w-5" />} subtitle={isFacility ? 'Active works' : 'Active maintenance'} variant="info" />
          </Link>
          <Link to="/tickets?status=completed" className="block focus:outline-none">
            <StatCard title="Completed" value={completedTickets} icon={<CheckCircle className="h-5 w-5" />} subtitle="Successfully closed" variant="accent" />
          </Link>
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <TicketStatusChart />
          <AssetTypeChart />
          <TopTechnicians />
          <MonthlyTicketsChart className="col-span-1 sm:col-span-2 lg:col-span-3" />
        </div>

        {/* ── Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="lg:col-span-2">
            <TicketsOverview />
          </div>
          <div>
            <RecentActivity />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
