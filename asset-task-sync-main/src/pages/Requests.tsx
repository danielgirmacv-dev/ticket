import { useState } from 'react';
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
import { useAssets } from '@/hooks/useAssets';
import { useCreateTicket } from '@/hooks/useTickets';
import { MaintenanceTicket } from '@/integrations/laravel/client';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Requests = () => {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { data: assets, isLoading: isLoadingAssets } = useAssets();
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
      });

      setIsSubmitted(true);
      setFormData({
        title: '',
        type: 'maintenance',
        priority: 'medium',
        description: '',
        status: 'submitted',
      });

      setLocation('');
      setPreferredDate('');

      toast({
        title: "Request submitted",
        description: "Your maintenance request has been submitted successfully.",
      });
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  if (isSubmitted) {
    return (
      <DashboardLayout
        title="Submit Request"
        subtitle="Create a new maintenance request"
      >
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center animate-fade-in">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Request Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your maintenance request has been submitted successfully. You will receive a notification once a technician is assigned.
            </p>
            <Button variant="accent" onClick={() => setIsSubmitted(false)}>
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

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
                  {assets?.filter(a => a.status === 'active' || a.status === 'maintenance').map(asset => (
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
    </DashboardLayout>
  );
};

export default Requests;
