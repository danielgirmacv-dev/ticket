import { useState } from 'react';
import { Link } from 'react-router-dom';
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
    Paperclip,
    FileText,
    ExternalLink,
    ArrowLeftRight,
    Loader2,
    Lock,
    ShieldCheck,
    Printer,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TicketWorkflow } from '@/components/tickets/TicketWorkflow';
import { EditTicketDialog } from '@/components/tickets/EditTicketDialog';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteTicket } from '@/hooks/useTicketWorkflow';
import { useUpdateTicket, useTransferTicket } from '@/hooks/useTickets';

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

const categoryLabels = {
    it_support: 'IT Support',
    sap: 'System Related Issue (SAP)',
    general: 'Facility & Maintenance',
};

const categoryStyles = {
    it_support: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    sap: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    general: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
};

export function TicketDetailsDialog({ ticket, open, onOpenChange, technicians = [], onApprove }: TicketDetailsDialogProps) {
    const { role, profile } = useAuth();
    const deleteTicket = useDeleteTicket();
    const updateTicket = useUpdateTicket();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showTransferDialog, setShowTransferDialog] = useState(false);
    const [targetCategory, setTargetCategory] = useState<'it_support' | 'sap' | 'general'>('it_support');
    const [transferReason, setTransferReason] = useState('');
    const transferTicket = useTransferTicket();

    if (!ticket) return null;

    const handleDelete = () => {
        deleteTicket.mutate(ticket.id, {
            onSuccess: () => {
                setShowDeleteDialog(false);
                onOpenChange(false);
            },
        });
    };

    const handleTransfer = () => {
        if (!ticket) return;
        transferTicket.mutate({
            id: ticket.id,
            support_category: targetCategory,
            reason: transferReason.trim() || undefined,
        }, {
            onSuccess: () => {
                setShowTransferDialog(false);
                setTransferReason('');
            }
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <div className="flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-lg sm:text-xl font-bold break-words">{ticket.title}</DialogTitle>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <TicketStatusBadge status={ticket.status} />
                                    <Badge className={priorityStyles[ticket.priority]} variant="outline">
                                        {ticket.priority} Priority
                                    </Badge>
                                    <Badge className={categoryStyles[ticket.support_category || 'general']} variant="outline">
                                        {categoryLabels[ticket.support_category || 'general']}
                                    </Badge>
                                    {['admin', 'super_admin'].includes(role ?? '') && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 px-1.5 text-[11px] text-muted-foreground hover:text-foreground gap-1 border border-dashed border-border"
                                            onClick={() => {
                                                const current = ticket.support_category || 'general';
                                                const next = current === 'it_support' ? 'sap' : current === 'sap' ? 'general' : 'it_support';
                                                setTargetCategory(next);
                                                setShowTransferDialog(true);
                                            }}
                                            title="Transfer ticket to another department"
                                        >
                                            <ArrowLeftRight className="h-2.5 w-2.5" />
                                            Transfer
                                        </Button>
                                    )}
                                    {ticket.is_recurring && (
                                        <Badge variant="outline">Recurring: {ticket.recurring_interval}</Badge>
                                    )}
                                </div>
                            </div>
                            {['admin', 'super_admin'].includes(role ?? '') && (
                                <div className="flex gap-2 self-end sm:self-start flex-shrink-0">
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
                                <div className="flex gap-2 self-end sm:self-start flex-shrink-0">
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

                        {/* Attachments */}
                        {ticket.images?.attachments && ticket.images.attachments.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" /> Attachments ({ticket.images.attachments.length})
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {ticket.images.attachments.map((file, idx) => {
                                        const isImage = file.mime.startsWith('image/');
                                        const fileSize = file.size
                                            ? `${(file.size / 1024).toFixed(1)} KB`
                                            : '';
                                        return (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    {isImage ? (
                                                        <div className="h-10 w-10 rounded border overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                                                            <img
                                                                src={file.url}
                                                                alt={file.name}
                                                                className="h-full w-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center flex-shrink-0">
                                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div className="overflow-hidden">
                                                        <p className="text-sm font-medium truncate pr-2" title={file.name}>
                                                            {file.name}
                                                        </p>
                                                        {fileSize && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {fileSize}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    asChild
                                                    className="flex-shrink-0 hover:bg-muted"
                                                >
                                                    <a
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Open / Download"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

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
                                            {ticket.requester?.name ? ticket.requester.name.charAt(0) : 'R'}
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Requester</span>
                                            <span className="text-sm font-medium">{ticket.requester?.name || 'Unknown'}</span>
                                        </div>
                                    </div>
                                    {ticket.assigned_manager && (
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-xs font-medium">
                                                {ticket.assigned_manager.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground block">Routed Manager</span>
                                                <span className="text-sm font-medium">{ticket.assigned_manager.name}</span>
                                            </div>
                                        </div>
                                    )}
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

                        {/* Feedback Section - Visible to Routed Manager & Technicians */}
                        {(ticket.feedback_rating || ticket.feedback_comment) && (
                            <div className="border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl p-5 shadow-xs space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
                                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                                        </div>
                                        Requester Feedback & Quality Review
                                    </h3>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0f5766]/15 text-[#0f5766] dark:text-[#38d8ef] border border-[#0f5766]/30 self-start sm:self-auto">
                                        <CheckCircle className="h-3 w-3 text-[#11adc4]" />
                                        Visible to Routed Manager
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1 bg-background/80 px-3 py-1.5 rounded-xl border border-amber-500/30 shadow-2xs">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`h-4 w-4 ${i < (ticket.feedback_rating || 0)
                                                    ? 'fill-amber-500 text-amber-500'
                                                    : 'text-gray-300 dark:text-gray-600'
                                                    }`}
                                            />
                                        ))}
                                        <span className="text-sm font-black text-foreground ml-1.5">
                                            {ticket.feedback_rating}/5
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                                        {ticket.feedback_rating === 5 && '⭐️⭐️⭐️⭐️⭐️ Exceptional Service'}
                                        {ticket.feedback_rating === 4 && '⭐️⭐️⭐️⭐️ Very Good / Satisfied'}
                                        {ticket.feedback_rating === 3 && '⭐️⭐️⭐️ Average / Acceptable'}
                                        {ticket.feedback_rating === 2 && '⭐️⭐️ Needs Improvement'}
                                        {ticket.feedback_rating === 1 && '⭐️ Poor Experience'}
                                    </span>
                                </div>

                                {/* Comment Visibility: Hidden from technicians, visible only to managers / requesters */}
                                {role === 'technician' ? (
                                    <div className="rounded-xl bg-muted/40 border border-border/70 p-3.5 flex items-center gap-2.5 text-xs text-muted-foreground">
                                        <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                                            <Lock className="h-3.5 w-3.5" />
                                        </div>
                                        <span>
                                            Written feedback comments are confidential and only accessible by your department manager.
                                        </span>
                                    </div>
                                ) : (
                                    ticket.feedback_comment && (
                                        <div className="rounded-xl bg-background/80 border border-amber-500/20 p-3.5 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                                                    Requester Comment (Manager & QA View)
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                                                    <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                                    Confidential to Manager
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground italic leading-relaxed">
                                                "{ticket.feedback_comment}"
                                            </p>
                                        </div>
                                    )
                                )}

                                <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2">
                                    <span>
                                        Routed Manager: <strong className="text-foreground">{ticket.assigned_manager?.name || 'Department Manager'}</strong>
                                    </span>
                                    <span className="text-amber-700 dark:text-amber-300 font-medium">
                                        {role === 'technician' ? 'Performance rating logged in QA' : 'Logged in Manager Dashboard Audit History'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t mt-4 space-y-3">
                        {ticket.status === 'completed' && (
                            <Button asChild className="w-full sm:w-auto gap-2">
                                <Link to={`/tickets/${ticket.id}/print`}>
                                    <Printer className="h-4 w-4" />
                                    Preview / Print Form
                                </Link>
                            </Button>
                        )}
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

            {/* Transfer Department Dialog */}
            <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowLeftRight className="h-5 w-5 text-primary" />
                            Transfer Department
                        </DialogTitle>
                        <DialogDescription>
                            Re-route this ticket to a different support queue. The assigned manager will be automatically updated.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Department</Label>
                            <div className="p-2.5 rounded-lg border bg-muted/30 text-sm font-medium flex items-center justify-between">
                                <span>{categoryLabels[ticket.support_category || 'general']}</span>
                                <Badge variant="outline" className={categoryStyles[ticket.support_category || 'general']}>Active</Badge>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transfer To</Label>
                            <Select value={targetCategory} onValueChange={(v) => setTargetCategory(v as any)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="it_support">🖥️ IT Support (Hardware, network, PC)</SelectItem>
                                    <SelectItem value="sap">🗄️ SAP System (ERP, modules & access)</SelectItem>
                                    <SelectItem value="general">🔧 General Support (Facility & equipment)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason for Transfer (Optional)</Label>
                            <Textarea
                                placeholder="e.g. Requester accidentally submitted under SAP, but this is a printer error..."
                                rows={3}
                                value={transferReason}
                                onChange={(e) => setTransferReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleTransfer}
                            disabled={transferTicket.isPending || targetCategory === (ticket.support_category || 'general')}
                            className="gap-1.5"
                        >
                            {transferTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
                            Confirm Transfer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
