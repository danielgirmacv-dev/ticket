import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import TicketsOverview from '@/components/dashboard/TicketsOverview';
import TopTechnicians from '@/components/dashboard/TopTechnicians';
import { TicketStatusChart, AssetTypeChart, MonthlyTicketsChart } from '@/components/dashboard/Charts';

import { Monitor, ClipboardList, Clock, CheckCircle, AlertTriangle, Wrench, Loader2 } from 'lucide-react';
import { useAssets } from '@/hooks/useAssets';
import { useTickets } from '@/hooks/useTickets';
import { useAuth } from '@/hooks/useAuth';

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
      <DashboardLayout title="Dashboard" subtitle="Loading dashboard data...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
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
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <Link to="/assets">
          <StatCard
            title="Total Assets"
            value={totalAssets}
            icon={<Monitor className="h-6 w-6" />}
            trend={{ value: 0, isPositive: true }} // We don't have trend data yet
          />
        </Link>
        <Link to="/assets?status=active">
          <StatCard
            title="Active Assets"
            value={activeAssets}
            icon={<CheckCircle className="h-6 w-6" />}
            variant="success"
          />
        </Link>
        <Link to="/tickets">
          <StatCard
            title="Total Tickets"
            value={totalTickets}
            icon={<ClipboardList className="h-6 w-6" />}
            trend={{ value: 0, isPositive: true }} // We don't have trend data yet
          />
        </Link>
        <Link to="/tickets?status=pending">
          <StatCard
            title="Pending Tickets"
            value={pendingTickets}
            icon={<Clock className="h-6 w-6" />}
            variant="warning"
          />
        </Link>
        <Link to="/tickets?status=in_progress">
          <StatCard
            title="In Progress"
            value={inProgressTickets}
            icon={<Wrench className="h-6 w-6" />}
            variant="info"
          />
        </Link>
        <Link to="/tickets?status=completed">
          <StatCard
            title="Completed"
            value={completedTickets}
            icon={<CheckCircle className="h-6 w-6" />}
            variant="accent"
          />
        </Link>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <TicketStatusChart />
        <AssetTypeChart />
        <TopTechnicians />
        <MonthlyTicketsChart className="col-span-1 md:col-span-2 lg:col-span-3" />
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TicketsOverview />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
