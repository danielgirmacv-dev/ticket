import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MaintenanceTicket } from '@/integrations/laravel/client';
import { useUpdateTicket } from '@/hooks/useTickets';
import { useAssets } from '@/hooks/useAssets';

interface EditTicketDialogProps {
    ticket: MaintenanceTicket | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditTicketDialog({ ticket, open, onOpenChange }: EditTicketDialogProps) {
    const updateTicket = useUpdateTicket();
    const { data: assets } = useAssets();
    const [form, setForm] = useState({
        title: '',
        description: '',
        type: 'maintenance' as MaintenanceTicket['type'],
        priority: 'medium' as MaintenanceTicket['priority'],
        asset_id: '',
        scheduled_date: '',
        is_recurring: false,
        recurring_interval: '' as MaintenanceTicket['recurring_interval'] | '',
    });

    useEffect(() => {
        if (ticket) {
            setForm({
                title: ticket.title,
                description: ticket.description || '',
                type: ticket.type,
                priority: ticket.priority,
                asset_id: ticket.asset_id,
                scheduled_date: ticket.scheduled_date?.slice(0, 16) || '',
                is_recurring: ticket.is_recurring,
                recurring_interval: ticket.recurring_interval || '',
            });
        }
    }, [ticket]);

    const handleSave = async () => {
        if (!ticket) return;
        await updateTicket.mutateAsync({
            id: ticket.id,
            title: form.title,
            description: form.description,
            type: form.type,
            priority: form.priority,
            asset_id: form.asset_id,
            scheduled_date: form.scheduled_date,
            is_recurring: form.is_recurring,
            recurring_interval: form.is_recurring && form.recurring_interval ? form.recurring_interval : null,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Ticket</DialogTitle>
                    <DialogDescription>Update ticket details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as MaintenanceTicket['type'] })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                    <SelectItem value="repair">Repair</SelectItem>
                                    <SelectItem value="installation">Installation</SelectItem>
                                    <SelectItem value="inspection">Inspection</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Priority</Label>
                            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as MaintenanceTicket['priority'] })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Asset</Label>
                        <Select value={form.asset_id} onValueChange={(v) => setForm({ ...form, asset_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                            <SelectContent>
                                {assets?.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Scheduled Date</Label>
                        <Input type="datetime-local" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Recurring ticket</Label>
                        <Switch checked={form.is_recurring} onCheckedChange={(c) => setForm({ ...form, is_recurring: c })} />
                    </div>
                    {form.is_recurring && (
                        <div className="grid gap-2">
                            <Label>Recurring interval</Label>
                            <Select value={form.recurring_interval || 'monthly'} onValueChange={(v) => setForm({ ...form, recurring_interval: v as MaintenanceTicket['recurring_interval'] })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={updateTicket.isPending}>
                        {updateTicket.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
