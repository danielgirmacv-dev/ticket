import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MaintenanceTicket } from '@/integrations/laravel/client';
import { Badge } from '@/components/ui/badge';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { format } from 'date-fns';
import {
    Calendar,
    Clock,
    User,
    Monitor,
    MapPin,
    CheckCircle,
    Star,
    MessageSquare,
    Wrench,
    AlertTriangle,
    Trash2,
    Pencil,
} from 'lucide-react';
import { TicketWorkflow } from '@/components/tickets/TicketWorkflow';
import { EditTicketDialog } from '@/components/tickets/EditTicketDialog';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteTicket } from '@/hooks/useTicketWorkflow';
import { useUpdateTicket } from '@/hooks/useTickets';

interface TicketDetailsDialogProps {
    ticket: MaintenanceTicket | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    technicians?: Array<{ id: string; name: string }>;
    onApprove?: () => void;
}

const priorityStyles = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function TicketDetailsDialog({ ticket, open, onOpenChange, technicians = [], onApprove }: TicketDetailsDialogProps) {
    const { role, profile } = useAuth();
    const deleteTicket = useDeleteTicket();
    const updateTicket = useUpdateTicket();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);

    if (!ticket) return null;

    const handleDelete = () => {
        deleteTicket.mutate(ticket.id, {
            onSuccess: () => {
                setShowDeleteDialog(false);
                onOpenChange(false);
            },
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <DialogTitle className="text-xl font-bold">{ticket.title}</DialogTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <TicketStatusBadge status={ticket.status} />
                                    <Badge className={priorityStyles[ticket.priority]} variant="outline">
                                        {ticket.priority} Priority
                                    </Badge>
                                    {ticket.is_recurring && (
                                        <Badge variant="outline">Recurring: {ticket.recurring_interval}</Badge>
                                    )}
                                </div>
                            </div>
                            {role === 'admin' && (
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setShowEditDialog(true)} title="Edit Ticket">
                                        <Pencil className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => setShowDeleteDialog(true)}
                                        title="Delete Ticket"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            )}
                            {role === 'requester' && profile?.id === ticket.requester_id && ticket.status === 'submitted' && (
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setShowEditDialog(true)} title="Edit Ticket">
                                        <Pencil className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive"
                                        onClick={() => {
                                            if (confirm('Cancel this ticket?')) {
                                                updateTicket.mutate({ id: ticket.id, status: 'cancelled' });
                                                onOpenChange(false);
                                            }
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Description */}
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                            <p className="text-sm">{ticket.description || 'No description provided.'}</p>
                        </div>

                        {/* Asset Info */}
                        {ticket.asset && (
                            <div className="bg-muted/40 p-4 rounded-lg">
                                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                    <Monitor className="h-4 w-4" /> Asset Details
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Name</span>
                                        <span className="text-sm font-medium">{ticket.asset.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Location</span>
                                        <div className="flex items-center gap-1.5 text-accent">
                                            <MapPin className="h-3.5 w-3.5" />
                                            <span className="text-sm font-medium">{ticket.asset.location}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Serial Number</span>
                                        <span className="text-sm font-medium">{ticket.asset.serial_number}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Type</span>
                                        <span className="text-sm font-medium capitalize">{ticket.asset.type}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Personnel & Timeline */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4" /> Personnel
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                            {ticket.requester?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Requester</span>
                                            <span className="text-sm font-medium">{ticket.requester?.name}</span>
                                        </div>
                                    </div>
                                    {ticket.assigned_technician && (
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                                                {ticket.assigned_technician.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block">Technician</span>
                                                <span className="text-sm font-medium">{ticket.assigned_technician.name}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Timeline
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Scheduled:</span>
                                        <span>{format(new Date(ticket.scheduled_date), 'PP')}</span>
                                    </div>
                                    {ticket.started_at && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Started:</span>
                                            <span>{format(new Date(ticket.started_at), 'PP p')}</span>
                                        </div>
                                    )}
                                    {ticket.completed_date && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Completed:</span>
                                            <span>{format(new Date(ticket.completed_date), 'PP p')}</span>
                                        </div>
                                    )}
                                    {ticket.actual_duration && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Duration:</span>
                                            <span>{Math.floor(ticket.actual_duration / 60)}h {ticket.actual_duration % 60}m</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Resolution / Actions Taken */}
                        {(ticket.actions_taken || ticket.diagnosis) && (
                            <div className="border rounded-lg p-4 bg-card">
                                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                    <Wrench className="h-4 w-4" /> Resolution Details
                                </h3>
                                {ticket.diagnosis && (
                                    <div className="mb-4">
                                        <span className="text-xs text-muted-foreground block mb-1">Diagnosis</span>
                                        <p className="text-sm bg-muted/30 p-2 rounded">{ticket.diagnosis}</p>
                                    </div>
                                )}
                                {ticket.actions_taken && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block mb-1">Actions Taken</span>
                                        <p className="text-sm bg-muted/30 p-2 rounded">{ticket.actions_taken}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Feedback Section */}
                        {(ticket.feedback_rating || ticket.feedback_comment) && (
                            <div className="border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900/30 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-500 mb-3 flex items-center gap-2">
                                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /> Requester Feedback
                                </h3>
                                <div className="flex items-center gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < (ticket.feedback_rating || 0)
                                                ? 'fill-yellow-500 text-yellow-500'
                                                : 'text-gray-300 dark:text-gray-600'
                                                }`}
                                        />
                                    ))}
                                    <span className="text-sm font-medium ml-2">
                                        {ticket.feedback_rating}/5
                                    </span>
                                </div>
                                {ticket.feedback_comment && (
                                    <div className="mt-2">
                                        <span className="text-xs text-yellow-700 dark:text-yellow-600 block mb-1">Comment</span>
                                        <p className="text-sm text-yellow-900 dark:text-yellow-200 italic">"{ticket.feedback_comment}"</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t mt-4">
                        <TicketWorkflow
                            ticket={ticket}
                            technicians={technicians}
                            onApprove={onApprove}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Ticket</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this ticket? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete Ticket
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <EditTicketDialog ticket={ticket} open={showEditDialog} onOpenChange={setShowEditDialog} />
        </>
    );
}
