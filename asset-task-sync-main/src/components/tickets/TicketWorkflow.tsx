import { useState } from 'react';
import { MaintenanceTicket } from '@/integrations/laravel/client';
import { useAuth } from '@/hooks/useAuth';
import {
    useApproveTicket,
    useRejectTicket,
    useAssignTicket,
    useStartTicket,
    useCompleteTicket,
    useReviewCompletion,
    useSubmitFeedback,
    useUpdateProgress,
} from '@/hooks/useTicketWorkflow';
import { useUpdateTicket } from '@/hooks/useTickets';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { CheckCircle, XCircle, UserPlus, Play, CheckCheck, Star, Wrench } from 'lucide-react';

const parseSpareParts = (text: string) =>
    text.split('\n').filter(Boolean).map((line) => ({ name: line.trim(), quantity: 1 }));

interface TicketWorkflowProps {
    ticket: MaintenanceTicket;
    technicians?: Array<{ id: string; name: string }>;
    onApprove?: () => void;
}

export function TicketWorkflow({ ticket, technicians = [], onApprove }: TicketWorkflowProps) {
    const { role, profile } = useAuth();
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [showProgressDialog, setShowProgressDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [reviewNotes, setReviewNotes] = useState('');
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [actionsTaken, setActionsTaken] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [sparePartsText, setSparePartsText] = useState('');
    const [actualDuration, setActualDuration] = useState('');

    const approveTicket = useApproveTicket();
    const rejectTicket = useRejectTicket();
    const assignTicket = useAssignTicket();
    const startTicket = useStartTicket();
    const completeTicket = useCompleteTicket();
    const reviewCompletion = useReviewCompletion();
    const submitFeedback = useSubmitFeedback();
    const updateProgress = useUpdateProgress();
    const updateTicket = useUpdateTicket();

    const canCancel =
        (['admin', 'super_admin'].includes(role ?? '') && !['completed', 'cancelled'].includes(ticket.status)) ||
        (role === 'requester' && profile?.id === ticket.requester_id && ticket.status === 'submitted');

    const handleCancel = () => {
        if (!confirm('Cancel this ticket?')) return;
        updateTicket.mutate({ id: ticket.id, status: 'cancelled' });
    };

    const handleSaveProgress = () => {
        updateProgress.mutate({
            id: ticket.id,
            diagnosis: diagnosis || undefined,
            actions_taken: actionsTaken || undefined,
            spare_parts: sparePartsText ? parseSpareParts(sparePartsText) : undefined,
        });
        setShowProgressDialog(false);
    };

    const cancelButton = canCancel ? (
        <Button onClick={handleCancel} size="sm" variant="outline" className="text-destructive border-destructive/30">
            Cancel Ticket
        </Button>
    ) : null;

    const handleApprove = () => {
        approveTicket.mutate(
            { id: ticket.id },
            {
                onSuccess: () => {
                    if (onApprove) {
                        onApprove();
                    } else {
                        setShowAssignDialog(true);
                    }
                }
            }
        );
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) return;
        rejectTicket.mutate({ id: ticket.id, rejection_reason: rejectionReason });
        setShowRejectDialog(false);
        setRejectionReason('');
    };

    const handleAssign = () => {
        if (!selectedTechnician) return;
        assignTicket.mutate({ id: ticket.id, assigned_technician_id: selectedTechnician });
        setShowAssignDialog(false);
        setSelectedTechnician('');
    };

    const handleStart = () => {
        startTicket.mutate(ticket.id);
    };

    const handleReview = (approved: boolean) => {
        reviewCompletion.mutate({ id: ticket.id, approved, notes: reviewNotes });
        setShowReviewDialog(false);
        setReviewNotes('');
    };

    const handleFeedback = () => {
        submitFeedback.mutate({ id: ticket.id, feedback_rating: feedbackRating, feedback_comment: feedbackComment });
        setShowFeedbackDialog(false);
        setFeedbackComment('');
    };

    // Admin actions
    if (['admin', 'super_admin'].includes(role ?? '')) {
        if (ticket.status === 'submitted') {
            return (
                <div className="flex flex-wrap gap-2">
                    <Button onClick={handleApprove} size="sm" variant="default">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                    </Button>
                    <Button onClick={() => setShowRejectDialog(true)} size="sm" variant="destructive">
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                    </Button>
                    {cancelButton}

                    <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reject Ticket</DialogTitle>
                                <DialogDescription>Please provide a reason for rejecting this ticket.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="reason">Rejection Reason</Label>
                                    <Textarea
                                        id="reason"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Explain why this ticket is being rejected..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleReject}>
                                    Reject Ticket
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            );
        }

        if (ticket.status === 'approved') {
            return (
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setShowAssignDialog(true)} size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign Technician
                    </Button>
                    {cancelButton}

                    <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Assign Technician</DialogTitle>
                                <DialogDescription>Select a technician to assign to this ticket.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <Label>Technician</Label>
                                    <Combobox
                                        options={technicians.map(tech => ({ value: tech.id, label: tech.name }))}
                                        value={selectedTechnician}
                                        onValueChange={setSelectedTechnician}
                                        placeholder="Select technician"
                                        emptyText="No technician found"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleAssign}>Assign</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            );
        }

        if (ticket.status === 'completed_pending_review') {
            return (
                <div>
                    <Button onClick={() => setShowReviewDialog(true)} size="sm">
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Review Completion
                    </Button>

                    <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Review Completed Ticket</DialogTitle>
                                <DialogDescription>Approve the completion or request revisions.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="notes">Notes (optional)</Label>
                                    <Textarea
                                        id="notes"
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Add any notes or feedback..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="destructive" onClick={() => handleReview(false)}>
                                    Request Revision
                                </Button>
                                <Button onClick={() => handleReview(true)}>Approve Completion</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            );
        }
    }

    // Technician actions
    if (role === 'technician' && ticket.assigned_technician_id === profile?.id) {
        if (ticket.status === 'assigned') {
            return (
                <Button onClick={handleStart} size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Start Ticket
                </Button>
            );
        }

        if (ticket.status === 'in_progress' || ticket.status === 'reopened') {
            const handleCompleteSubmit = () => {
                if (!actionsTaken.trim()) return;
                completeTicket.mutate({
                    id: ticket.id,
                    actions_taken: actionsTaken,
                    spare_parts: sparePartsText ? parseSpareParts(sparePartsText) : undefined,
                    actual_duration: actualDuration ? Number(actualDuration) : undefined,
                });
                setShowCompleteDialog(false);
                setActionsTaken('');
                setSparePartsText('');
                setActualDuration('');
            };

            return (
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setShowProgressDialog(true)} size="sm" variant="outline">
                        <Wrench className="h-4 w-4 mr-2" />
                        Update Progress
                    </Button>
                    <Button onClick={() => setShowCompleteDialog(true)} size="sm" variant="default">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {ticket.status === 'reopened' ? 'Resubmit Ticket' : 'Complete Ticket'}
                    </Button>

                    <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Update Progress</DialogTitle>
                                <DialogDescription>Save diagnosis and work in progress</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Diagnosis</Label>
                                    <Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} placeholder="Issue diagnosis..." />
                                </div>
                                <div>
                                    <Label>Work done so far</Label>
                                    <Textarea value={actionsTaken} onChange={(e) => setActionsTaken(e.target.value)} rows={2} />
                                </div>
                                <div>
                                    <Label>Spare parts (one per line)</Label>
                                    <Textarea value={sparePartsText} onChange={(e) => setSparePartsText(e.target.value)} rows={2} placeholder="RAM 8GB&#10;Thermal paste" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowProgressDialog(false)}>Cancel</Button>
                                <Button onClick={handleSaveProgress}>Save Progress</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{ticket.status === 'reopened' ? 'Resubmit Ticket' : 'Complete Ticket'}</DialogTitle>
                                <DialogDescription>
                                    {ticket.status === 'reopened'
                                        ? 'Address feedback and describe corrections made.'
                                        : 'Describe the actions taken to complete this ticket.'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="actions">Actions Taken *</Label>
                                    <Textarea
                                        id="actions"
                                        value={actionsTaken}
                                        onChange={(e) => setActionsTaken(e.target.value)}
                                        placeholder="Describe what you did..."
                                        rows={4}
                                    />
                                </div>
                                <div>
                                    <Label>Spare parts used (one per line)</Label>
                                    <Textarea value={sparePartsText} onChange={(e) => setSparePartsText(e.target.value)} rows={2} />
                                </div>
                                <div>
                                    <Label>Actual duration (minutes)</Label>
                                    <Input type="number" min="0" value={actualDuration} onChange={(e) => setActualDuration(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>Cancel</Button>
                                <Button onClick={handleCompleteSubmit}>
                                    {ticket.status === 'reopened' ? 'Resubmit for Review' : 'Mark as Complete'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            );
        }
    }

    // Requester actions
    if (role === 'requester' && profile?.id === ticket.requester_id) {
        if (ticket.status === 'completed_pending_review') {
            return (
                <div>
                    <Button onClick={() => setShowReviewDialog(true)} size="sm">
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Verify Completion
                    </Button>

                    <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Verify Ticket Completion</DialogTitle>
                                <DialogDescription>Confirm the work is done to your satisfaction.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="notes">Notes (optional)</Label>
                                    <Textarea
                                        id="notes"
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Add any notes..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="destructive" onClick={() => handleReview(false)}>
                                    Not Done / Reopen
                                </Button>
                                <Button onClick={() => handleReview(true)}>Confirm Completion</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            );
        }

        if (ticket.status === 'completed' && !ticket.feedback_rating) {
            return (
                <div>
                    <Button onClick={() => setShowFeedbackDialog(true)} size="sm" variant="outline">
                        <Star className="h-4 w-4 mr-2" />
                        Provide Feedback
                    </Button>

                    <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Provide Feedback</DialogTitle>
                                <DialogDescription>Rate the quality of work and provide comments.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Rating</Label>
                                    <Select value={feedbackRating.toString()} onValueChange={(v) => setFeedbackRating(Number(v))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">⭐⭐⭐⭐⭐ Excellent</SelectItem>
                                            <SelectItem value="4">⭐⭐⭐⭐ Good</SelectItem>
                                            <SelectItem value="3">⭐⭐⭐ Average</SelectItem>
                                            <SelectItem value="2">⭐⭐ Poor</SelectItem>
                                            <SelectItem value="1">⭐ Very Poor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="comment">Comment (optional)</Label>
                                    <Textarea
                                        id="comment"
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                        placeholder="Share your experience..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleFeedback}>Submit Feedback</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            );
        }
    }

    return null;
}
