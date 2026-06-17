import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAssignTicket } from '@/hooks/useTicketWorkflow';
import { MaintenanceTicket } from '@/integrations/laravel/client';

interface AssignTechnicianDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket: MaintenanceTicket | null;
    technicians: Array<{ id: string; name: string }>;
    onSuccess?: () => void;
}

export function AssignTechnicianDialog({
    open,
    onOpenChange,
    ticket,
    technicians,
    onSuccess
}: AssignTechnicianDialogProps) {
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const assignTicket = useAssignTicket();

    // Reset selection when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedTechnician('');
        }
    }, [open]);

    const handleAssign = () => {
        if (!selectedTechnician || !ticket) return;

        assignTicket.mutate(
            { id: ticket.id, assigned_technician_id: selectedTechnician },
            {
                onSuccess: () => {
                    onOpenChange(false);
                    if (onSuccess) onSuccess();
                }
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Technician</DialogTitle>
                    <DialogDescription>
                        Select a technician to assign to ticket: <span className="font-medium">{ticket?.title}</span>
                    </DialogDescription>
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={!selectedTechnician || assignTicket.isPending}>
                        {assignTicket.isPending ? 'Assigning...' : 'Assign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
