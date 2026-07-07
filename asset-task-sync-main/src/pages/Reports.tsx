import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    useTicketReport,
    useAssetReport,
    usePerformanceReport,
    downloadTicketReportCsv,
    downloadAssetReportCsv,
    ReportFilters
} from '@/hooks/useReports';
import { useAssets } from '@/hooks/useAssets';
import { useUsers } from '@/hooks/useUsers';
import { FileDown, Printer, TrendingUp, Package, Wrench, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('tickets');
    const [filters, setFilters] = useState<ReportFilters>({
        start_date: '',
        end_date: '',
        status: 'all',
        type: 'all',
        priority: 'all',
        asset_id: 'all',
        assigned_technician_id: 'all',
        location: '',
    });

    const { data: assets } = useAssets();
    const { data: users } = useUsers();
    const technicians = users?.filter(u => u.role === 'technician') || [];

    const { data: ticketData, isLoading: isLoadingTickets } = useTicketReport(filters);
    const { data: assetData, isLoading: isLoadingAssets } = useAssetReport(filters);
    const { data: performanceData, isLoading: isLoadingPerformance } = usePerformanceReport(filters);

    const handleFilterChange = (key: keyof ReportFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportCsv = () => {
        if (activeTab === 'tickets') {
            downloadTicketReportCsv(filters);
        } else if (activeTab === 'assets') {
            downloadAssetReportCsv(filters);
        }
    };

    return (
        <DashboardLayout title="Reports">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground mt-2">
                        Generate and export detailed reports for tickets and assets
                    </p>
                </div>

                {/* Filters Card */}
                <Card className="print:hidden">
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>Configure report parameters</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div>
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={filters.start_date}
                                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={filters.end_date}
                                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select value={filters.status} onValueChange={(val) => handleFilterChange('status', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="submitted">Submitted</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="assigned">Assigned</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Type</Label>
                                <Select value={filters.type} onValueChange={(val) => handleFilterChange('type', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="maintenance">Maintenance</SelectItem>
                                        <SelectItem value="repair">Repair</SelectItem>
                                        <SelectItem value="installation">Installation</SelectItem>
                                        <SelectItem value="inspection">Inspection</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Priority</Label>
                                <Select value={filters.priority} onValueChange={(val) => handleFilterChange('priority', val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Priorities</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div>
                                <Label>Asset</Label>
                                <Select value={filters.asset_id || 'all'} onValueChange={(val) => handleFilterChange('asset_id', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All assets" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Assets</SelectItem>
                                        {assets?.map((asset) => (
                                            <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Technician</Label>
                                <Select value={filters.assigned_technician_id || 'all'} onValueChange={(val) => handleFilterChange('assigned_technician_id', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All technicians" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Technicians</SelectItem>
                                        {technicians.map((tech) => (
                                            <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Location</Label>
                                <Input
                                    placeholder="Filter by location"
                                    value={filters.location || ''}
                                    onChange={(e) => handleFilterChange('location', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                            <Button onClick={handleExportCsv} variant="outline">
                                <FileDown className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                            <Button onClick={handlePrint} variant="outline">
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Reports Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="print:hidden">
                        <TabsTrigger value="tickets">
                            <Wrench className="h-4 w-4 mr-2" />
                            Ticket Report
                        </TabsTrigger>
                        <TabsTrigger value="assets">
                            <Package className="h-4 w-4 mr-2" />
                            Asset Report
                        </TabsTrigger>
                        <TabsTrigger value="performance">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Performance
                        </TabsTrigger>
                    </TabsList>

                    {/* Ticket Report Tab */}
                    <TabsContent value="tickets">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ticket Report</CardTitle>
                                <CardDescription>
                                    {filters.start_date && filters.end_date &&
                                        `${format(new Date(filters.start_date), 'MMM d, yyyy')} - ${format(new Date(filters.end_date), 'MMM d, yyyy')}`
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingTickets ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-2">Title</th>
                                                    <th className="text-left p-2">Type</th>
                                                    <th className="text-left p-2">Status</th>
                                                    <th className="text-left p-2">Priority</th>
                                                    <th className="text-left p-2">Asset</th>
                                                    <th className="text-left p-2">Assigned To</th>
                                                    <th className="text-left p-2">Scheduled Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ticketData?.map((ticket) => (
                                                    <tr key={ticket.id} className="border-b hover:bg-muted/50">
                                                        <td className="p-2">{ticket.title}</td>
                                                        <td className="p-2 capitalize">{ticket.type}</td>
                                                        <td className="p-2">
                                                            <span className={cn(
                                                                'px-2 py-1 rounded-full text-xs',
                                                                ticket.status === 'completed' && 'bg-success/10 text-success',
                                                                ticket.status === 'in_progress' && 'bg-info/10 text-info',
                                                                ticket.status === 'submitted' && 'bg-warning/10 text-warning'
                                                            )}>
                                                                {ticket.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 capitalize">{ticket.priority}</td>
                                                        <td className="p-2">{ticket.asset?.name || 'N/A'}</td>
                                                        <td className="p-2">{ticket.assigned_technician?.name || 'Unassigned'}</td>
                                                        <td className="p-2">{format(new Date(ticket.scheduled_date), 'MMM d, yyyy')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {ticketData?.length === 0 && (
                                            <p className="text-center py-8 text-muted-foreground">No tickets found</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Asset Report Tab */}
                    <TabsContent value="assets">
                        <Card>
                            <CardHeader>
                                <CardTitle>Asset Report</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoadingAssets ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-2">Name</th>
                                                    <th className="text-left p-2">Type</th>
                                                    <th className="text-left p-2">Status</th>
                                                    <th className="text-left p-2">Serial Number</th>
                                                    <th className="text-left p-2">Location</th>
                                                    <th className="text-left p-2">Assigned To</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assetData?.map((asset) => (
                                                    <tr key={asset.id} className="border-b hover:bg-muted/50">
                                                        <td className="p-2">{asset.name}</td>
                                                        <td className="p-2 capitalize">{asset.type.replace('_', ' ')}</td>
                                                        <td className="p-2">
                                                            <span className={cn(
                                                                'px-2 py-1 rounded-full text-xs',
                                                                asset.status === 'active' && 'bg-success/10 text-success',
                                                                asset.status === 'maintenance' && 'bg-warning/10 text-warning',
                                                                asset.status === 'retired' && 'bg-muted text-muted-foreground'
                                                            )}>
                                                                {asset.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-2">{asset.serial_number}</td>
                                                        <td className="p-2">{asset.location}</td>
                                                        <td className="p-2">{asset.assigned_user?.name || 'Unassigned'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {assetData?.length === 0 && (
                                            <p className="text-center py-8 text-muted-foreground">No assets found</p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Performance Tab */}
                    <TabsContent value="performance">
                        {isLoadingPerformance ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{performanceData?.summary?.total_tickets || 0}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-success">{performanceData?.summary?.completed_tickets || 0}</div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {performanceData?.summary?.completion_rate || 0}% completion rate
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-destructive">{performanceData?.summary?.overdue_tickets || 0}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{performanceData?.summary?.avg_completion_days || 0}</div>
                                            <p className="text-xs text-muted-foreground mt-1">days</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Technician Performance Table */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Technician Performance</CardTitle>
                                        <CardDescription>Detailed performance metrics by technician</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left p-2">Technician</th>
                                                        <th className="text-left p-2">Assigned</th>
                                                        <th className="text-left p-2">Completed</th>
                                                        <th className="text-left p-2">Completion Rate</th>
                                                        <th className="text-left p-2">Avg Rating</th>
                                                        <th className="text-left p-2">Avg Time (Days)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {performanceData?.technician_stats?.map((tech) => (
                                                        <tr key={tech.assigned_technician_id} className="border-b hover:bg-muted/50">
                                                            <td className="p-2 font-medium">{tech.assigned_technician?.name || 'Unknown'}</td>
                                                            <td className="p-2">{tech.total_assigned}</td>
                                                            <td className="p-2">{tech.completed_count}</td>
                                                            <td className="p-2">
                                                                {tech.total_assigned > 0
                                                                    ? Math.round((tech.completed_count / tech.total_assigned) * 100)
                                                                    : 0}%
                                                            </td>
                                                            <td className="p-2">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="font-medium">{Number(tech.avg_rating || 0).toFixed(1)}</span>
                                                                    <span className="text-yellow-500">★</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-2">{Number(tech.avg_completion_days || 0).toFixed(1)}</td>
                                                        </tr>
                                                    ))}
                                                    {(!performanceData?.technician_stats || performanceData.technician_stats.length === 0) && (
                                                        <tr>
                                                            <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                                                No technician data available
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
        </DashboardLayout>
    );
};

export default Reports;
