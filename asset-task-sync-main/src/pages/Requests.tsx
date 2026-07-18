import { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { Combobox } from '@/components/ui/combobox';
import { useAssets } from '@/hooks/useAssets';
import { useLocations } from '@/hooks/useLocations';
import { useAuth } from '@/hooks/useAuth';
import { useCreateTicket } from '@/hooks/useTickets';
import { MaintenanceTicket } from '@/integrations/laravel/client';
import { Send, Loader2, Paperclip, X, Copy, ExternalLink, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ASSET_REQUIRED_TYPES: MaintenanceTicket['type'][] = [
  'repair',
  'maintenance',
  'installation',
  'inspection',
];

const EXPECTED_RESPONSE: Record<NonNullable<MaintenanceTicket['priority']>, string> = {
  critical: 'within 2 hours',
  high: 'within 4 hours',
  medium: 'within 1–2 business days',
  low: 'within 3–5 business days',
};

function ticketReference(id: string) {
  return `TKT-${id.slice(0, 8).toUpperCase()}`;
}

function RequiredMark() {
  return <span className="text-destructive ml-0.5" aria-hidden="true">*</span>;
}

const Requests = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<MaintenanceTicket | null>(null);

  const { data: assets, isLoading: isLoadingAssets } = useAssets();
  const { data: locations, isLoading: isLoadingLocations } = useLocations();
  const { role, profile } = useAuth();
  const createTicket = useCreateTicket();

  const [formData, setFormData] = useState<Partial<MaintenanceTicket>>({
    title: '',
    type: 'repair',
    priority: 'medium',
    description: '',
    status: 'submitted',
    asset_id: undefined,
  });

  const [locationId, setLocationId] = useState('');
  const [supportCategory, setSupportCategory] = useState<'it_support' | 'sap' | 'general'>('general');
  const [preferredDate, setPreferredDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] =
    useState<NonNullable<MaintenanceTicket['recurring_interval']>>('monthly');
  const [recurringEndsAt, setRecurringEndsAt] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const showAssetField = ASSET_REQUIRED_TYPES.includes(
    (formData.type || 'other') as MaintenanceTicket['type']
  );
  const isUrgent =
    formData.priority === 'high' || formData.priority === 'critical';

  const availableAssets = useMemo(() => {
    return (
      assets?.filter(
        (a) =>
          (a.status === 'active' || a.status === 'maintenance') &&
          (role !== 'requester' || a.assigned_to === profile?.id)
      ) || []
    );
  }, [assets, role, profile?.id]);

  const assetOptions = useMemo(
    () => [
      { value: 'none', label: 'None / No asset' },
      ...availableAssets.map((asset) => ({
        value: asset.id,
        label: `${asset.type} — ${asset.name} (${asset.serial_number})`,
      })),
    ],
    [availableAssets]
  );

  const locationOptions = useMemo(
    () =>
      (locations || []).map((loc) => ({
        value: loc.id,
        label: loc.name + (loc.address ? ` — ${loc.address}` : ''),
      })),
    [locations]
  );

  // Prefill location from profile; never auto-assign company-wide assets
  useEffect(() => {
    if (profile?.location_id && !locationId) {
      setLocationId(profile.location_id);
    }
  }, [profile?.location_id, locationId]);

  // Clear asset when type no longer needs one
  useEffect(() => {
    if (!showAssetField && formData.asset_id) {
      setFormData((prev) => ({ ...prev, asset_id: undefined }));
    }
  }, [showAssetField, formData.asset_id]);

  // Clear preferred date when priority becomes urgent
  useEffect(() => {
    if (isUrgent && preferredDate) {
      setPreferredDate('');
    }
  }, [isUrgent, preferredDate]);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const next = [...attachments, ...files].slice(0, 5);
    const oversized = next.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length) {
      toast({
        title: 'File too large',
        description: 'Each attachment must be 5MB or less.',
        variant: 'destructive',
      });
      return;
    }
    setAttachments(next);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'repair',
      priority: 'medium',
      description: '',
      status: 'submitted',
      asset_id: undefined,
    });
    setLocationId(profile?.location_id || '');
    setSupportCategory('general');
    setPreferredDate('');
    setIsRecurring(false);
    setRecurringInterval('monthly');
    setRecurringEndsAt('');
    setAttachments([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationId) {
      toast({
        title: 'Location required',
        description: 'Please select a location from the list.',
        variant: 'destructive',
      });
      return;
    }

    if (isRecurring && !recurringEndsAt) {
      toast({
        title: 'End date required',
        description: 'Choose when the recurring schedule should end.',
        variant: 'destructive',
      });
      return;
    }

    const selectedLocation = locations?.find((l) => l.id === locationId);
    const locationLabel = selectedLocation?.name || locationId;

    const descriptionParts = [formData.description || ''];
    descriptionParts.push(`\nLocation: ${locationLabel}`);
    if (!isUrgent && preferredDate) {
      descriptionParts.push(`Preferred Date: ${preferredDate}`);
    }

    const scheduledDate =
      !isUrgent && preferredDate
        ? preferredDate
        : new Date().toISOString().split('T')[0];

    const payload = new FormData();
    payload.append('title', formData.title || '');
    payload.append('description', descriptionParts.join('\n'));
    payload.append('type', formData.type || 'other');
    payload.append('support_category', supportCategory);
    payload.append('priority', formData.priority || 'medium');
    payload.append('status', 'submitted');
    payload.append('scheduled_date', scheduledDate);
    payload.append('is_recurring', isRecurring ? '1' : '0');

    if (formData.asset_id) {
      payload.append('asset_id', formData.asset_id);
    }
    if (isRecurring) {
      payload.append('recurring_interval', recurringInterval);
      payload.append('recurring_ends_at', recurringEndsAt);
    }
    attachments.forEach((file) => {
      payload.append('attachments[]', file);
    });

    try {
      const ticket = await createTicket.mutateAsync(payload);
      setSubmittedTicket(ticket);
      setShowSuccessDialog(true);
      resetForm();
    } catch {
      // Error toast handled by mutation
    }
  };

  if (isLoadingAssets || isLoadingLocations) {
    return (
      <DashboardLayout title="Submit Request" subtitle="Create a new IT support request">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Submit Request"
      subtitle="Create a new IT support request"
    >
      <Card className="max-w-2xl mx-auto overflow-hidden border-t-4 border-t-teal-600 dark:border-t-teal-500 shadow-lg">
        <CardHeader>
          <CardTitle>New Request</CardTitle>
          <CardDescription>
            Submit a request for IT support. Our team will review it and respond based on priority.
          </CardDescription>
          <div className="mt-4 rounded-lg border border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-teal-800 dark:text-teal-300 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
              Check the Help Center first — your question may already be answered.
            </p>
            <Button variant="outline" size="sm" asChild className="border-teal-500/30 text-teal-700 hover:bg-teal-500/10 dark:text-teal-300">
              <Link to="/help">Browse FAQ</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="title">Request Title<RequiredMark /></Label>
              <Input
                id="title"
                placeholder="e.g., Computer not starting up"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Support Department routing */}
            <div className="grid gap-2">
              <Label>Support Department<RequiredMark /></Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  { value: 'it_support', label: 'IT Support', desc: 'Hardware, software, connectivity', color: 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/10 text-blue-700 dark:text-blue-300' },
                  { value: 'sap', label: 'SAP System', desc: 'SAP ERP, deployment, modules', color: 'border-teal-400 bg-teal-50/50 dark:bg-teal-950/10 text-teal-700 dark:text-teal-300' },
                  { value: 'general', label: 'General', desc: 'Other / not specific', color: 'border-slate-400 bg-slate-50/50 dark:bg-slate-950/10 text-slate-700 dark:text-slate-300' },
                ] as const).map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSupportCategory(cat.value)}
                    className={cn(
                      'rounded-xl border-2 px-4 py-3 text-left transition-all duration-150 hover:shadow-sm focus:outline-none',
                      supportCategory === cat.value
                        ? cat.color + ' ring-2 ring-offset-1 ring-current font-semibold shadow-sm'
                        : 'border-muted bg-muted/10 hover:border-muted-foreground/40'
                    )}
                  >
                    <p className="text-sm font-semibold">{cat.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cat.desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Your request will be automatically routed to the correct team based on this selection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Request Type<RequiredMark /></Label>
                <Select
                  required
                  value={formData.type}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      type: val as MaintenanceTicket['type'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="repair">Repair / Hardware issue</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="other">Other / Access / Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority<RequiredMark /></Label>
                <Select
                  required
                  value={formData.priority}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      priority: val as MaintenanceTicket['priority'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low — Can wait</SelectItem>
                    <SelectItem value="medium">Medium — Within a few days</SelectItem>
                    <SelectItem value="high">High — Urgent</SelectItem>
                    <SelectItem value="critical">Critical — Immediate attention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showAssetField && (
              <div className="grid gap-2">
                <Label>Related Asset</Label>
                <Combobox
                  options={assetOptions}
                  value={formData.asset_id || 'none'}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      asset_id: !val || val === 'none' ? undefined : val,
                    })
                  }
                  placeholder="Search and select an asset"
                  emptyText={
                    role === 'requester'
                      ? 'No assets assigned to your account yet'
                      : 'No assets found'
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {role === 'requester'
                    ? 'Optional — only assets assigned to you by an admin appear here.'
                    : 'Optional — search by name, type, or serial number.'}
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Location<RequiredMark /></Label>
              <Combobox
                options={locationOptions}
                value={locationId}
                onValueChange={setLocationId}
                placeholder="Select office / branch"
                emptyText="No locations configured"
              />
              <p className="text-xs text-muted-foreground">
                Choose from the official location list so reports stay consistent.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description<RequiredMark /></Label>
              <Textarea
                id="description"
                placeholder="Describe the issue in detail. Include error messages, symptoms, or steps already tried..."
                rows={5}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="attachments">Attachments</Label>
              <div className="rounded-lg border border-dashed p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <label htmlFor="attachments" className="cursor-pointer">
                      <Paperclip className="h-4 w-4 mr-2" />
                      Add files
                    </label>
                  </Button>
                  <Input
                    id="attachments"
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={handleFilesChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Screenshots or photos help technicians resolve faster (max 5 files, 5MB each).
                  </p>
                </div>
                {attachments.length > 0 && (
                  <ul className="space-y-2">
                    {attachments.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                      >
                        <span className="truncate mr-3">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {!isUrgent && (
              <div className="grid gap-2">
                <Label htmlFor="preferred-date">Preferred Date</Label>
                <Input
                  id="preferred-date"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-muted-foreground">
                  Optional — when you would prefer this to be scheduled.
                </p>
              </div>
            )}
            {isUrgent && (
              <p className="text-xs text-muted-foreground rounded-md border bg-muted/40 px-3 py-2">
                Preferred date is hidden for High/Critical requests — the team will prioritize this immediately.
              </p>
            )}

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Recurring request</Label>
                <p className="text-xs text-muted-foreground">
                  Schedule this to repeat on an interval
                </p>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            {isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4 bg-muted/20">
                <div className="space-y-2">
                  <Label>Frequency<RequiredMark /></Label>
                  <Select
                    value={recurringInterval}
                    onValueChange={(val) =>
                      setRecurringInterval(
                        val as NonNullable<MaintenanceTicket['recurring_interval']>
                      )
                    }
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
                <div className="space-y-2">
                  <Label htmlFor="recurring-ends">Ends on<RequiredMark /></Label>
                  <Input
                    id="recurring-ends"
                    type="date"
                    required={isRecurring}
                    value={recurringEndsAt}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setRecurringEndsAt(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-[#012229] to-[#075362] hover:opacity-90 text-white font-semibold shadow-md" disabled={createTicket.isPending}>
                {createTicket.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
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

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md text-center p-8 border-none bg-card/95 backdrop-blur-md shadow-2xl rounded-2xl">
          <DialogHeader className="flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <span className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping opacity-75" />
              <svg
                className="w-12 h-12 text-teal-600 dark:text-teal-400 relative z-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              Request Submitted
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm max-w-sm space-y-3">
              <span className="block">
                Your request landed with the IT team. Keep this reference for follow-ups.
              </span>
              {submittedTicket && (
                <span className="block space-y-2">
                  <span className="inline-flex items-center gap-2 rounded-lg border bg-muted/60 px-3 py-2 font-mono text-base font-semibold text-foreground">
                    {ticketReference(submittedTicket.id)}
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        navigator.clipboard.writeText(ticketReference(submittedTicket.id));
                        toast({ title: 'Copied', description: 'Ticket reference copied.' });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </span>
                  <span className="block text-sm">
                    Expected response:{' '}
                    <strong className="text-foreground">
                      {EXPECTED_RESPONSE[submittedTicket.priority] || EXPECTED_RESPONSE.medium}
                    </strong>
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex flex-col gap-2">
            {submittedTicket && (
              <Button
                variant="outline"
                className="border-teal-500/20 text-teal-800 dark:text-teal-300 hover:bg-teal-500/10"
                onClick={() => {
                  setShowSuccessDialog(false);
                  navigate(`/tickets/${submittedTicket.id}`);
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View request
              </Button>
            )}
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="w-full bg-gradient-to-r from-[#012229] to-[#075362] hover:opacity-90 text-white font-semibold py-6 rounded-xl"
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
