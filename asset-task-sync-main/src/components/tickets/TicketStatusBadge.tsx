import { Badge } from '@/components/ui/badge';

interface TicketStatusBadgeProps {
    status: string;
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
        submitted: { label: 'Submitted', variant: 'secondary' },
        approved: { label: 'Approved', variant: 'default' },
        rejected: { label: 'Rejected', variant: 'destructive' },
        assigned: { label: 'Assigned', variant: 'default' },
        in_progress: { label: 'In Progress', variant: 'default' },
        completed_pending_review: { label: 'Pending Review', variant: 'secondary' },
        completed: { label: 'Completed', variant: 'outline' },
        reopened: { label: 'Reopened', variant: 'destructive' },
        cancelled: { label: 'Cancelled', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary' };

    return (
        <Badge variant={config.variant} className="capitalize">
            {config.label}
        </Badge>
    );
}
