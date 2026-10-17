import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAssets } from '@/hooks/useAssets';
import { useTickets } from '@/hooks/useTickets';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths, eachMonthOfInterval, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';

// EEC Brand Palette: Primary #11adc4, Dark Teal #0f5766, plus status colors
const STATUS_COLORS: Record<string, string> = {
  Completed: '#10B981', // Emerald
  'In progress': '#11adc4', // EEC Primary
  Submitted: '#F59E0B', // Amber
  Pending: '#F59E0B', // Amber
  Cancelled: '#EF4444', // Red
  'Completed pending review': '#0f5766', // EEC Dark Teal
};

const ASSET_TYPE_COLORS: Record<string, string> = {
  Computer: '#11adc4', // EEC Primary
  Server: '#0f5766', // EEC Dark Teal
  Printer: '#6366F1', // Indigo
  Network_device: '#10B981', // Emerald
  Other: '#F59E0B', // Amber
};

const FALLBACK_COLORS = ['#11adc4', '#0f5766', '#10B981', '#F59E0B', '#6366F1', '#8B5CF6'];

export const TicketStatusChart = () => {
  const { data: tickets, isLoading } = useTickets();

  if (isLoading) {
    return (
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Skeleton className="h-36 w-36 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const statusCounts = tickets?.reduce((acc, ticket) => {
    const raw = ticket.status.replace('_', ' ');
    const status = raw.charAt(0).toUpperCase() + raw.slice(1);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const data = Object.entries(statusCounts).map(([name, value], idx) => ({
    name,
    value,
    fill: STATUS_COLORS[name] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
  }));

  if (data.length === 0) {
    return (
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Ticket Status Distribution</CardTitle>
          <CardDescription className="text-xs">Live status breakdown</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
          No ticket data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/80 shadow-xs border-t-2 border-t-[#11adc4] overflow-hidden">
      <CardHeader className="pb-3 bg-muted/20 border-b border-border/40">
        <CardTitle className="text-[18px] font-bold tracking-tight text-foreground">Ticket Status Distribution</CardTitle>
        <CardDescription className="text-[13px] text-muted-foreground mt-0.5">Active breakdown across all tickets</CardDescription>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="46%"
                innerRadius={48}
                outerRadius={74}
                paddingAngle={3}
                dataKey="value"
                stroke="hsl(var(--card))"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-[13px] text-muted-foreground font-medium">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const AssetTypeChart = () => {
  const { data: assets, isLoading } = useAssets();

  if (isLoading) {
    return (
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Skeleton className="h-36 w-36 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const typeCounts = assets?.reduce((acc, asset) => {
    const raw = (asset.type || 'other').replace('_', ' ');
    const type = raw.charAt(0).toUpperCase() + raw.slice(1);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const data = Object.entries(typeCounts).map(([name, value], idx) => ({
    name,
    value,
    fill: ASSET_TYPE_COLORS[name] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length],
  }));

  if (data.length === 0) {
    return (
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Assets by Category</CardTitle>
          <CardDescription className="text-xs">Inventory distribution</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
          No asset data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border/80 shadow-xs border-t-2 border-t-[#0f5766] overflow-hidden">
      <CardHeader className="pb-3 bg-muted/20 border-b border-border/40">
        <CardTitle className="text-[18px] font-bold tracking-tight text-foreground">Assets by Category</CardTitle>
        <CardDescription className="text-[13px] text-muted-foreground mt-0.5">Inventory hardware composition</CardDescription>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="46%"
                innerRadius={48}
                outerRadius={74}
                paddingAngle={3}
                dataKey="value"
                stroke="hsl(var(--card))"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-[13px] text-muted-foreground font-medium">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const MonthlyTicketsChart = ({ className }: { className?: string }) => {
  const { data: tickets, isLoading } = useTickets();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <Skeleton className="h-36 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Generate last 6 months
  const end = new Date();
  const start = subMonths(end, 5);
  const months = eachMonthOfInterval({ start, end });

  const data = months.map((month) => {
    const count = tickets?.filter((ticket) =>
      ticket.status === 'completed' &&
      isSameMonth(new Date(ticket.updated_at), month)
    )?.length || 0;

    return {
      month: format(month, 'MMM'),
      tickets: count,
    };
  });

  return (
    <Card className={cn('border border-border/80 shadow-xs border-t-2 border-t-[#11adc4] overflow-hidden', className)}>
      <CardHeader className="pb-3 bg-muted/20 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[18px] font-bold tracking-tight text-foreground">Monthly Ticket Resolution</CardTitle>
            <CardDescription className="text-[13px] text-muted-foreground mt-0.5">Resolved tickets over the past 6 months</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#11adc4] shadow-xs shadow-[#11adc4]/50" />
            <span className="text-[13px] font-semibold text-foreground">Completed</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="h-[210px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.6} />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                }}
                cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
              />
              <Bar
                dataKey="tickets"
                fill="#11adc4"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
