import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Plus, Search, Calendar, Clock, User, Monitor, ArrowRight, Loader2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { TicketWorkflow } from '@/components/tickets/TicketWorkflow';
import { TicketDetailsDialog } from '@/components/tickets/TicketDetailsDialog';
import { AssignTechnicianDialog } from '@/components/tickets/AssignTechnicianDialog';

const statusStyles = {
  pending: 'status-pending',
  in_progress: 'status-in-progress',
  completed: 'status-completed',
  cancelled: 'bg-muted text-muted-foreground',
};

const priorityStyles = {
  low: 'priority-low',
  medium: 'priority-medium',
  high: 'priority-high',
  critical: 'bg-destructive text-destructive-foreground',
};

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

  const { role } = useAuth();

  const { data: tickets, isLoading: isLoadingTickets } = useTickets();
  const { data: assets } = useAssets();
  const { data: users } = useUsers();
  const createTicket = useCreateTicket();
  const { ticketId } = useParams();

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

  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (ticket.asset?.name.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    // Status filtering is handled by tabs
    return matchesSearch && matchesPriority;
  }) || [];

  const ticketsByStatus = {
    all: filteredTickets,
    pending: filteredTickets.filter(t => t.status === 'submitted'),
    in_progress: filteredTickets.filter(t => t.status === 'in_progress'),
    review: filteredTickets.filter(t => t.status === 'completed_pending_review'),
    completed: filteredTickets.filter(t => t.status === 'completed'),
  };

  const TicketCard = ({ ticket, index }: { ticket: MaintenanceTicket; index: number }) => (
    <Card
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => {
        setSelectedTicket(ticket);
        setIsDetailsOpen(true);
      }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn('text-xs', priorityStyles[ticket.priority])}>
                {ticket.priority}
              </Badge>
              <TicketStatusBadge status={ticket.status} />
              {ticket.is_recurring && (
                <Badge variant="outline" className="text-xs">
                  Recurring
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-base group-hover:text-accent transition-colors truncate">
              {ticket.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {ticket.description}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(ticket.scheduled_date), 'MMM d, yyyy')}</span>
          </div>
          {ticket.estimated_duration && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{Math.floor(ticket.estimated_duration / 60)}h {ticket.estimated_duration % 60}m</span>
            </div>
          )}
        </div>

        {ticket.asset && (
          <div className="bg-muted/40 p-3 rounded-md mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">{ticket.asset.name}</span>
            </div>
            <div className="flex items-center gap-2 text-accent font-medium bg-accent/10 px-3 py-1.5 rounded-full self-start sm:self-auto">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{ticket.asset.location}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Requester:</span>
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px] bg-muted">
                  {ticket.requester?.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{ticket.requester?.name}</span>
            </div>
          </div>
          {ticket.assigned_technician && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Tech:</span>
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {ticket.assigned_technician.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{ticket.assigned_technician.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Workflow Actions */}
        <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
          <TicketWorkflow
            ticket={ticket}
            technicians={users?.filter(u => u.role === 'technician').map(u => ({
              id: u.id,
              name: u.name
            })) || []}
            onApprove={() => {
              setTicketToAssign(ticket);
              setIsAssignDialogOpen(true);
            }}
          />
        </div>
      </CardContent>
    </Card >
  );

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
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
          {role !== 'requester' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Issue Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
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
                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
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
      <Tabs defaultValue={searchParams.get('status') === 'submitted' ? 'pending' : searchParams.get('status') || 'all'} className="w-full" >
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge variant="secondary" className="ml-1 text-xs bg-slate-100 dark:bg-slate-800">
              {ticketsByStatus.all.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            <Badge variant="secondary" className="ml-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
              {ticketsByStatus.pending.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-2">
            In Progress
            <Badge variant="secondary" className="ml-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              {ticketsByStatus.in_progress.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-2">
            In Review
            <Badge variant="secondary" className="ml-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
              {ticketsByStatus.review.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            Completed
            <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              {ticketsByStatus.completed.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {Object.keys(ticketsByStatus).map((status) => (
          <TabsContent key={status} value={status}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {ticketsByStatus[status as keyof typeof ticketsByStatus].map((ticket, index) => (
                <TicketCard key={ticket.id} ticket={ticket} index={index} />
              ))}
            </div>
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
        technicians={users?.filter(u => u.role === 'technician').map(u => ({
          id: u.id,
          name: u.name
        })) || []}
        onApprove={() => {
          setTicketToAssign(selectedTicket);
          setIsAssignDialogOpen(true);
        }}
      />

      <AssignTechnicianDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        ticket={ticketToAssign}
        technicians={users?.filter(u => u.role === 'technician').map(u => ({
          id: u.id,
          name: u.name
        })) || []}
      />
    </DashboardLayout >
  );
};

export default Tickets;
