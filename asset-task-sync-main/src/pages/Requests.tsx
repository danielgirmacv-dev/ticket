import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAssets } from '@/hooks/useAssets';
import { useAuth } from '@/hooks/useAuth';
import { useCreateTicket } from '@/hooks/useTickets';
import { MaintenanceTicket } from '@/integrations/laravel/client';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Requests = () => {
  const { toast } = useToast();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const { data: assets, isLoading: isLoadingAssets } = useAssets();
  const { role, profile } = useAuth();
  const createTicket = useCreateTicket();

  const [formData, setFormData] = useState<Partial<MaintenanceTicket>>({
    title: '',
    type: 'maintenance',
    priority: 'medium',
    description: '',
    status: 'submitted',
  });

  const [location, setLocation] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('monthly');

  // Pre-fill location from requester profile
  useEffect(() => {
    if (profile?.location?.name && !location) {
      setLocation(profile.location.name);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Append location to description
    const fullDescription = `${formData.description}\n\nLocation: ${location}${preferredDate ? `\nPreferred Date: ${preferredDate}` : ''}`;

    // Use preferredDate as scheduled_date, or default to today if not provided
    const scheduledDate = preferredDate || new Date().toISOString().split('T')[0];

    try {
      await createTicket.mutateAsync({
        ...formData,
        description: fullDescription,
        scheduled_date: scheduledDate,
        is_recurring: isRecurring,
        recurring_interval: isRecurring ? recurringInterval : null,
      });

      setShowSuccessDialog(true);
      setFormData({
        title: '',
        type: 'maintenance',
        priority: 'medium',
        description: '',
        status: 'submitted',
      });

      // Keep location pre-filled
      setLocation(profile?.location?.name || '');
      setPreferredDate('');
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };



  if (isLoadingAssets) {
    return (
      <DashboardLayout title="Submit Request" subtitle="Create a new maintenance request">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Submit Request"
      subtitle="Create a new maintenance request"
    >
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>New Maintenance Request</CardTitle>
          <CardDescription>
            Fill out the form below to submit a maintenance request. Our IT team will review and respond as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="title">Request Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Computer not starting up"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Request Type *</Label>
                <Select
                  required
                  value={formData.type}
                  onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority *</Label>
                <Select
                  required
                  value={formData.priority}
                  onValueChange={(val: any) => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Can wait</SelectItem>
                    <SelectItem value="medium">Medium - Within a few days</SelectItem>
                    <SelectItem value="high">High - Urgent</SelectItem>
                    <SelectItem value="critical">Critical - Immediate attention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Related Asset</Label>
              <Select onValueChange={(val) => setFormData({ ...formData, asset_id: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an asset (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {assets?.filter(a => (a.status === 'active' || a.status === 'maintenance') && (role !== 'requester' || a.assigned_to === profile?.id)).map(asset => (
                    <SelectItem key={asset.id} value={asset.id}>
                      <span className="capitalize">{asset.type}</span> - {asset.name} ({asset.serial_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select the IT asset that needs attention, if applicable
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Building A - Floor 2 - Room 201"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Please describe the issue or request in detail. Include any error messages, symptoms, or relevant information that will help our technicians..."
                rows={5}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="preferred-date">Preferred Date (Optional)</Label>
              <Input
                id="preferred-date"
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                When would you prefer the maintenance to be scheduled?
              </p>
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
                <Select value={recurringInterval} onValueChange={(val: any) => setRecurringInterval(val)}>
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

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={createTicket.isPending}>
                {createTicket.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Dialog Modal */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md text-center p-8 border-none bg-card/95 backdrop-blur-md shadow-2xl rounded-2xl animate-scale-up">
          <DialogHeader className="flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-success/10 text-success">
              <span className="absolute inset-0 rounded-full bg-success/20 animate-ping opacity-75" />
              <svg className="w-12 h-12 text-success relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" className="animate-checkmark-draw" />
              </svg>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              Request Submitted!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm max-w-sm">
              Your maintenance request has been submitted successfully. You will receive a notification once a technician is assigned.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={() => setShowSuccessDialog(false)}
              className="w-full max-w-xs bg-gradient-to-r from-success to-emerald-600 hover:from-success/90 hover:to-emerald-600/90 text-white font-semibold py-6 rounded-xl shadow-lg shadow-success/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Requests;
