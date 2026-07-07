import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useMaintenanceSchedules, useCreateSchedule, useUpdateSchedule, useDeleteSchedule } from '@/hooks/useMaintenanceSchedules';
import { useAssets } from '@/hooks/useAssets';
import { Calendar, Plus, Trash2, Loader2, Pencil } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { MaintenanceSchedule } from '@/types/schedule';

export default function Schedules() {
    const { data: schedules, isLoading } = useMaintenanceSchedules();
    const { data: assets } = useAssets();
    const createSchedule = useCreateSchedule();
    const updateSchedule = useUpdateSchedule();
    const deleteSchedule = useDeleteSchedule();

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<MaintenanceSchedule | null>(null);
    const [editForm, setEditForm] = useState<Partial<MaintenanceSchedule>>({});
    const [formData, setFormData] = useState<Partial<MaintenanceSchedule>>({
        title: '',
        description: '',
        asset_id: '',
        type: 'maintenance',
        frequency: 'monthly',
        next_run_date: new Date().toISOString().split('T')[0],
        is_active: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createSchedule.mutateAsync(formData);
        setShowCreateDialog(false);
        setFormData({
            title: '',
            description: '',
            asset_id: '',
            type: 'maintenance',
            frequency: 'monthly',
            next_run_date: new Date().toISOString().split('T')[0],
            is_active: true,
        });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this schedule?')) {
            await deleteSchedule.mutateAsync(id);
        }
    };

    const openEdit = (schedule: MaintenanceSchedule) => {
        setEditingSchedule(schedule);
        setEditForm({
            title: schedule.title,
            description: schedule.description || '',
            asset_id: schedule.asset_id,
            type: schedule.type,
            frequency: schedule.frequency,
            next_run_date: schedule.next_run_date?.slice(0, 10),
            is_active: schedule.is_active,
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSchedule) return;
        await updateSchedule.mutateAsync({ id: editingSchedule.id, ...editForm });
        setEditingSchedule(null);
    };

    if (isLoading) {
        return (
            <DashboardLayout title="Preventive Maintenance" subtitle="Manage scheduled maintenance tickets">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Preventive Maintenance" subtitle="Manage scheduled maintenance tickets">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Maintenance Schedules</h2>
                        <p className="text-muted-foreground">Automate recurring maintenance tickets</p>
                    </div>
                    <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Schedule
                    </Button>
                </div>

                <div className="grid gap-4">
                    {schedules?.map((schedule) => (
                        <Card key={schedule.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {schedule.title}
                                            {schedule.is_active ? (
                                                <Badge variant="default">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>{schedule.description}</CardDescription>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(schedule)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(schedule.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Asset</p>
                                        <p className="font-medium">{schedule.asset?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Frequency</p>
                                        <p className="font-medium capitalize">{schedule.frequency}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Next Run</p>
                                        <p className="font-medium">{new Date(schedule.next_run_date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Last Run</p>
                                        <p className="font-medium">
                                            {schedule.last_run_date
                                                ? new Date(schedule.last_run_date).toLocaleDateString()
                                                : 'Never'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {schedules?.length === 0 && (
                        <Card>
                            <CardContent className="py-16 text-center">
                                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No schedules yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first preventive maintenance schedule to automate recurring tickets.
                                </p>
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Schedule
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create Maintenance Schedule</DialogTitle>
                            <DialogDescription>
                                Set up a recurring maintenance ticket that will be automatically created based on the schedule.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        placeholder="e.g., Monthly Server Maintenance"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the maintenance ticket..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Asset *</Label>
                                        <Select
                                            value={formData.asset_id}
                                            onValueChange={(val) => setFormData({ ...formData, asset_id: val })}
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select asset" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {assets?.map((asset) => (
                                                    <SelectItem key={asset.id} value={asset.id}>
                                                        {asset.name} ({asset.serial_number})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Type *</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(val) => setFormData({ ...formData, type: val as MaintenanceSchedule['type'] })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                                <SelectItem value="inspection">Inspection</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Frequency *</Label>
                                        <Select
                                            value={formData.frequency}
                                            onValueChange={(val) => setFormData({ ...formData, frequency: val as MaintenanceSchedule['frequency'] })}
                                        >
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

                                    <div className="grid gap-2">
                                        <Label htmlFor="next_run_date">First Run Date *</Label>
                                        <Input
                                            id="next_run_date"
                                            type="date"
                                            value={formData.next_run_date}
                                            onChange={(e) => setFormData({ ...formData, next_run_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createSchedule.isPending}>
                                    {createSchedule.isPending ? 'Creating...' : 'Create Schedule'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={!!editingSchedule} onOpenChange={() => setEditingSchedule(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit Schedule</DialogTitle>
                            <DialogDescription>Update this maintenance schedule</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Title</Label>
                                    <Input value={editForm.title || ''} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description</Label>
                                    <Textarea value={editForm.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Asset</Label>
                                        <Select value={editForm.asset_id} onValueChange={(v) => setEditForm({ ...editForm, asset_id: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {assets?.map((a) => (
                                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Frequency</Label>
                                        <Select value={editForm.frequency} onValueChange={(v) => setEditForm({ ...editForm, frequency: v as MaintenanceSchedule['frequency'] })}>
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
                                </div>
                                <div className="grid gap-2">
                                    <Label>Next Run Date</Label>
                                    <Input type="date" value={editForm.next_run_date || ''} onChange={(e) => setEditForm({ ...editForm, next_run_date: e.target.value })} required />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Active</Label>
                                    <Switch checked={editForm.is_active ?? true} onCheckedChange={(c) => setEditForm({ ...editForm, is_active: c })} />
                                </div>
                            </div>
                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={() => setEditingSchedule(null)}>Cancel</Button>
                                <Button type="submit" disabled={updateSchedule.isPending}>
                                    {updateSchedule.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
