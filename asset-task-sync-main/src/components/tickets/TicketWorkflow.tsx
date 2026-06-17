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
} from '@/hooks/useTicketWorkflow';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, UserPlus, Play, CheckCheck, Star } from 'lucide-react';

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
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [reviewNotes, setReviewNotes] = useState('');
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [actionsTaken, setActionsTaken] = useState('');

    const approveTicket = useApproveTicket();
    const rejectTicket = useRejectTicket();
    const assignTicket = useAssignTicket();
    const startTicket = useStartTicket();
    const completeTicket = useCompleteTicket();
    const reviewCompletion = useReviewCompletion();
    const submitFeedback = useSubmitFeedback();

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
    if (role === 'admin') {
        if (ticket.status === 'submitted') {
            return (
                <div className="flex gap-2">
                    <Button onClick={handleApprove} size="sm" variant="default">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                    </Button>
                    <Button onClick={() => setShowRejectDialog(true)} size="sm" variant="destructive">
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                    </Button>

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
                <div>
                    <Button onClick={() => setShowAssignDialog(true)} size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign Technician
                    </Button>

                    <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Assign Technician</DialogTitle>
                                <DialogDescription>Select a technician to assign to this ticket.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Technician</Label>
                                    <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select technician" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {technicians.map((tech) => (
                                                <SelectItem key={tech.id} value={tech.id}>
                                                    {tech.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                completeTicket.mutate({ id: ticket.id, actions_taken: actionsTaken });
                setShowCompleteDialog(false);
                setActionsTaken('');
            };

            return (
                <div>
                    <Button onClick={() => setShowCompleteDialog(true)} size="sm" variant="default">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {ticket.status === 'reopened' ? 'Resubmit Ticket' : 'Complete Ticket'}
                    </Button>

                    <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{ticket.status === 'reopened' ? 'Resubmit Ticket' : 'Complete Ticket'}</DialogTitle>
                                <DialogDescription>
                                    {ticket.status === 'reopened'
                                        ? 'Address the admin\'s feedback and describe the corrections you made.'
                                        : 'Describe the actions you took to complete this ticket.'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="actions">Actions Taken *</Label>
                                    <Textarea
                                        id="actions"
                                        value={actionsTaken}
                                        onChange={(e) => setActionsTaken(e.target.value)}
                                        placeholder="Describe what you did to complete this ticket..."
                                        rows={4}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
                                    Cancel
                                </Button>
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
