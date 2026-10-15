import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useTickets, useCreateTicket } from '@/hooks/useTickets';
import { useAuth } from '@/hooks/useAuth';
import { useAssets } from '@/hooks/useAssets';
import { useUsers } from '@/hooks/useUsers';
import { MaintenanceTicket } from '@/integrations/laravel/client';
import { Plus, Search, Calendar, Loader2 } from 'lucide-react';
import { TicketCard } from '@/components/tickets/TicketCard';
import { TicketListView } from '@/components/tickets/TicketListView';
import { TicketStatusTabs } from '@/components/tickets/TicketStatusTabs';
import { TicketViewToggle } from '@/components/tickets/TicketViewToggle';
import { TicketDetailsDialog } from '@/components/tickets/TicketDetailsDialog';
import { AssignTechnicianDialog } from '@/components/tickets/AssignTechnicianDialog';
import { useTicketsViewMode } from '@/hooks/useTicketsViewMode';

const Tickets = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [ticketToAssign, setTicketToAssign] = useState<MaintenanceTicket | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<string>('monthly');

  const { role, profile } = useAuth();
  const isSuperAdmin = role === 'super_admin';

  const { data: tickets, isLoading: isLoadingTickets } = useTickets();
  const { data: assets } = useAssets();
  const { data: users } = useUsers();
  const createTicket = useCreateTicket();
  const { ticketId } = useParams();
  const { viewMode, setViewMode } = useTicketsViewMode();

  const isSapEntity = (dept?: string | null, name?: string | null, email?: string | null) => {
    const text = `${dept || ''} ${name || ''} ${email || ''}`.toLowerCase();
    return text.includes('sap') || text.includes('erp');
  };

  const getTechniciansForTicket = (ticket: MaintenanceTicket | null) => {
    const allTechs = users?.filter(u => u.role === 'technician') || [];
    const isManagerSap = isSapEntity(profile?.department, profile?.name, profile?.email);

    if (!ticket) {
      if (isManagerSap) {
        return allTechs.filter(t => isSapEntity(t.department, t.name, t.email)).map(u => ({ id: u.id, name: u.name }));
      }
      if (role === 'admin') {
        return allTechs.filter(t => !isSapEntity(t.department, t.name, t.email)).map(u => ({ id: u.id, name: u.name }));
      }
      return allTechs.map(u => ({ id: u.id, name: u.name }));
    }

    const category = ticket.support_category || (isManagerSap ? 'sap' : 'it_support');
    if (category === 'sap') {
      return allTechs.filter(t => isSapEntity(t.department, t.name, t.email)).map(u => ({ id: u.id, name: u.name }));
    }
    if (category === 'it_support') {
      return allTechs.filter(t => !isSapEntity(t.department, t.name, t.email)).map(u => ({ id: u.id, name: u.name }));
    }

    // General tickets:
    if (isManagerSap) {
      return allTechs.filter(t => isSapEntity(t.department, t.name, t.email)).map(u => ({ id: u.id, name: u.name }));
    }
    if (role === 'admin') {
      return allTechs.filter(t => !isSapEntity(t.department, t.name, t.email)).map(u => ({ id: u.id, name: u.name }));
    }
    return allTechs.map(u => ({ id: u.id, name: u.name }));
  };

  useEffect(() => {
    if (ticketId && tickets) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
        setIsDetailsOpen(true);
      }
    }
  }, [ticketId, tickets]);

  const handleCreateTicket = (data: Record<string, unknown>) => {
    createTicket.mutate({
      ...data,
      is_recurring: isRecurring,
      recurring_interval: isRecurring ? recurringInterval : null,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setIsRecurring(false);
        setRecurringInterval('monthly');
      },
    });
  };

  const filteredTickets = (tickets?.filter(ticket => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (ticket.asset?.name.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    // Status filtering is handled by tabs
    return matchesSearch && matchesPriority;
  }) || []).sort((a, b) => {
    const order = (s: string) =>
      s === 'submitted' ? 0 : s === 'completed_pending_review' ? 1 : 2;
    const diff = order(a.status) - order(b.status);
    if (diff !== 0) return diff;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const ticketsByStatus = {
    all: filteredTickets,
    pending: filteredTickets.filter(t => t.status === 'submitted'),
    in_progress: filteredTickets.filter(t => t.status === 'in_progress'),
    review: filteredTickets.filter(t => t.status === 'completed_pending_review'),
    completed: filteredTickets.filter(t => t.status === 'completed'),
  };

  const openTicket = (ticket: MaintenanceTicket) => {
    setSelectedTicket(ticket);
    setIsDetailsOpen(true);
  };

  if (isLoadingTickets) {
    return (
      <DashboardLayout title="Ticket Management" subtitle="View and manage maintenance tickets">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Ticket Management" subtitle="View and manage maintenance tickets" >
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          {(role === 'admin' || role === 'super_admin') && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Issue Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Issue Ticket</DialogTitle>
                <DialogDescription>
                  Create a new maintenance ticket. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateTicket({
                  title: formData.get('title'),
                  description: formData.get('description'),
                  type: formData.get('type'),
                  priority: formData.get('priority'),
                  asset_id: formData.get('asset_id'),
                  scheduled_date: formData.get('scheduled_date'),
                  estimated_duration: Number(formData.get('estimated_duration')),
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select name="type" required defaultValue="maintenance">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="installation">Installation</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="asset_id">Asset</Label>
                    <Select name="asset_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {assets?.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            <span className="capitalize">{asset.type}</span> - {asset.name} ({asset.serial_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" required defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_date">Scheduled Date</Label>
                    <Input id="scheduled_date" name="scheduled_date" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_duration">Est. Duration (minutes)</Label>
                    <Input id="estimated_duration" name="estimated_duration" type="number" min="0" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>Recurring ticket</Label>
                    <p className="text-xs text-muted-foreground">Automatically schedule repeat maintenance</p>
                  </div>
                  <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                </div>
                {isRecurring && (
                  <div className="space-y-2">
                    <Label>Recurring interval</Label>
                    <Select value={recurringInterval} onValueChange={setRecurringInterval}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <DialogFooter>
                  <Button type="submit" disabled={createTicket.isPending}>
                    {createTicket.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Ticket
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={searchParams.get('status') === 'submitted' ? 'pending' : searchParams.get('status') || 'all'} className="w-full">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-5">
          <div className="flex-1 min-w-0 w-full">
            <TicketStatusTabs
              counts={{
                all: ticketsByStatus.all.length,
                pending: ticketsByStatus.pending.length,
                in_progress: ticketsByStatus.in_progress.length,
                review: ticketsByStatus.review.length,
                completed: ticketsByStatus.completed.length,
              }}
            />
          </div>
          <TicketViewToggle value={viewMode} onChange={setViewMode} className="self-end lg:self-auto shrink-0" />
        </div>

        {Object.keys(ticketsByStatus).map((status) => (
          <TabsContent key={status} value={status}>
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {ticketsByStatus[status as keyof typeof ticketsByStatus].map((ticket, index) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    index={index}
                    onOpen={openTicket}
                    technicians={getTechniciansForTicket(ticket)}
                    onApproveAssign={(t) => {
                      setTicketToAssign(t);
                      setIsAssignDialogOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <TicketListView
                tickets={ticketsByStatus[status as keyof typeof ticketsByStatus]}
                onOpen={openTicket}
                getTechnicians={getTechniciansForTicket}
                onApproveAssign={(t) => {
                  setTicketToAssign(t);
                  setIsAssignDialogOpen(true);
                }}
              />
            )}
            {ticketsByStatus[status as keyof typeof ticketsByStatus].length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
                <p className="text-muted-foreground">
                  {status === 'all'
                    ? 'Create your first maintenance ticket to get started'
                    : `No ${status.replace('_', ' ')} tickets at the moment`}
                </p>
              </div>
            )}
          </TabsContent>
        ))
        }
      </Tabs >

      <TicketDetailsDialog
        ticket={selectedTicket}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        technicians={getTechniciansForTicket(selectedTicket)}
        onApprove={() => {
          setTicketToAssign(selectedTicket);
          setIsAssignDialogOpen(true);
        }}
      />

      <AssignTechnicianDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        ticket={ticketToAssign}
        technicians={getTechniciansForTicket(ticketToAssign)}
      />
    </DashboardLayout >
  );
};

export default Tickets;
