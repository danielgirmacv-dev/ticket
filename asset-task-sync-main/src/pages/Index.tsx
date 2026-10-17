import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import TicketsOverview from '@/components/dashboard/TicketsOverview';
import TopTechnicians from '@/components/dashboard/TopTechnicians';
import { TicketStatusChart, AssetTypeChart, MonthlyTicketsChart } from '@/components/dashboard/Charts';

import { Button } from '@/components/ui/button';
import { Monitor, ClipboardList, Clock, CheckCircle, AlertTriangle, Wrench, Loader2, Plus, Sparkles } from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';
import { useTickets } from '@/hooks/useTickets';
import { useAuth } from '@/hooks/useAuth';
import { DashboardOverviewSkeleton } from '@/components/skeletons/DashboardOverviewSkeleton';

const Index = () => {
  const { role, loading: authLoading } = useAuth();
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

  if (isLoading) {
    return (
      <DashboardLayout
        title="Dashboard"
        subtitle="Welcome back. Here's what's happening today."
      >
        <DashboardOverviewSkeleton />
      </DashboardLayout>
    );
  }

  // Calculate stats
  const totalAssets = assets?.length || 0;
  const activeAssets = assets?.filter(a => a.status === 'active').length || 0;

  const totalTickets = tickets?.length || 0;
  const pendingTickets = tickets?.filter(t => t.status === 'submitted').length || 0;
  const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0;
  const completedTickets = tickets?.filter(t => t.status === 'completed').length || 0;

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Welcome back. Here's what's happening today."
    >
      <div className="space-y-5">
        {/* Colorful Quick Action / Overview Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#0f5766]/15 via-[#11adc4]/10 to-card border border-[#11adc4]/30 shadow-xs">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#11adc4] shadow-xs shadow-[#11adc4]/50 animate-pulse" />
              Operational Summary
            </h3>
            <p className="text-xs sm:text-[13px] text-muted-foreground mt-0.5">Real-time status of company assets and maintenance tickets</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
            <Link to="/tickets">
              <Button size="sm" variant="default" className="gap-1.5 shadow-md h-9 text-xs font-semibold">
                <Plus className="h-4 w-4" />
                Issue Ticket
              </Button>
            </Link>
            <Link to="/assets">
              <Button size="sm" variant="accent" className="gap-1.5 shadow-md h-9 text-xs font-semibold">
                <Monitor className="h-4 w-4" />
                Assets
              </Button>
            </Link>
            <Link to="/requests">
              <Button size="sm" variant="secondary" className="gap-1.5 shadow-md h-9 text-xs font-semibold">
                <Wrench className="h-4 w-4" />
                Requests
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Row - Consistent 16-20px gaps */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          <Link to="/assets" className="block focus:outline-none">
            <StatCard
              title="Total Assets"
              value={totalAssets}
              icon={<Monitor className="h-5 w-5" />}
              subtitle="Hardware inventory"
              variant="primary"
            />
          </Link>
          <Link to="/assets?status=active" className="block focus:outline-none">
            <StatCard
              title="Active Assets"
              value={activeAssets}
              icon={<CheckCircle className="h-5 w-5" />}
              subtitle="Currently operational"
              variant="success"
            />
          </Link>
          <Link to="/tickets" className="block focus:outline-none">
            <StatCard
              title="Total Tickets"
              value={totalTickets}
              icon={<ClipboardList className="h-5 w-5" />}
              subtitle="All logged tickets"
              variant="secondary"
            />
          </Link>
          <Link to="/tickets?status=pending" className="block focus:outline-none">
            <StatCard
              title="Pending Tickets"
              value={pendingTickets}
              icon={<Clock className="h-5 w-5" />}
              subtitle="Awaiting technician"
              variant="warning"
            />
          </Link>
          <Link to="/tickets?status=in_progress" className="block focus:outline-none">
            <StatCard
              title="In Progress"
              value={inProgressTickets}
              icon={<Wrench className="h-5 w-5" />}
              subtitle="Active maintenance"
              variant="info"
            />
          </Link>
          <Link to="/tickets?status=completed" className="block focus:outline-none">
            <StatCard
              title="Completed"
              value={completedTickets}
              icon={<CheckCircle className="h-5 w-5" />}
              subtitle="Successfully closed"
              variant="accent"
            />
          </Link>
        </div>

        {/* Charts Row - Consistent 16-20px gaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <TicketStatusChart />
          <AssetTypeChart />
          <TopTechnicians />
          <MonthlyTicketsChart className="col-span-1 md:col-span-2 lg:col-span-3" />
        </div>

        {/* Content Row - Consistent 16-20px gaps */}
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
