import { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
import { Send, Loader2, Paperclip, X, Copy, ExternalLink, HelpCircle, Activity, Monitor, Database, Wrench, Check, UploadCloud, FileText, MapPin, Calendar as CalendarIcon, Repeat, Info } from 'lucide-react';
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

const SAP_KEYWORDS = [
  'sap', 'tcode', 't-code', 'fbl3n', 'me21n', 'migo', 'miro', 'fb60', 'va01', 'me23n',
  'su01', 'erp', 'gui', 'sap logon', 'gl account', 'purchase order', 'po approval',
  'cost center', 'profit center', 'pr approval', 'abap', 'hana', 'bapi', 'workflow approval',
  'fico', 'mm module', 'sd module', 'pm module', 'sap password', 'sap user', 'sap error',
  'sap access', 't code', 'transaction code', 'idoc', 'posting', 'invoice verification'
];

const IT_KEYWORDS = [
  'printer', 'scanner', 'photocopier', 'toner', 'cartridge', 'paper jam', 'monitor',
  'screen', 'display', 'hdmi', 'vga', 'mouse', 'keyboard', 'laptop', 'desktop', 'pc',
  'computer', 'cpu', 'ram', 'hard disk', 'ssd', 'wifi', 'wi-fi', 'internet', 'ethernet',
  'lan cable', 'router', 'switch', 'outlook', 'email', 'teams', 'windows', 'blue screen',
  'bsod', 'macbook', 'charger', 'power cable', 'ups', 'projector', 'headset', 'webcam',
  'microphone', 'hardware', 'slow computer', 'virus', 'antivirus', 'lan'
];

const FACILITY_KEYWORDS = [
  'air conditioner', 'ac', 'cooling', 'heating', 'ventilation', 'leak', 'water', 'pipe',
  'plumbing', 'toilet', 'restroom', 'sink', 'bulb', 'light', 'lighting', 'power socket',
  'wall socket', 'outlet', 'electricity', 'circuit breaker', 'power trip', 'generator',
  'door lock', 'lock', 'key', 'handle', 'door', 'window', 'desk', 'chair', 'furniture',
  'drawer', 'cabinet', 'carpet', 'paint', 'painting', 'ceiling', 'roof', 'office chair'
];

const REQUEST_TYPES_BY_CATEGORY: Record<
  'it_support' | 'sap' | 'general',
  Array<{ value: MaintenanceTicket['type']; label: string }>
> = {
  it_support: [
    { value: 'repair', label: '🖥️ Hardware Repair (PC, Laptop, Monitor, Printer)' },
    { value: 'maintenance', label: '🌐 Network & Wi-Fi / Connectivity Issue' },
    { value: 'installation', label: '📦 Software Installation & Device Setup' },
    { value: 'inspection', label: '🔍 IT Diagnostic & Hardware Inspection' },
    { value: 'other', label: '❓ Other IT Support Request' },
  ],
  sap: [
    { value: 'other', label: '🔑 User Account / Role & Authorization Request' },
    { value: 'repair', label: '⚠️ Transaction / T-Code Error & Bug Fix' },
    { value: 'installation', label: '⚙️ SAP Module / Authorization Config' },
    { value: 'maintenance', label: '🔄 Data / Configuration Maintenance' },
    { value: 'inspection', label: '📋 Authorization & Access Review' },
  ],
  general: [
    { value: 'repair', label: '⚡ Electrical & Lighting (Power Sockets, Bulbs, Breaker)' },
    { value: 'maintenance', label: '❄️ AC, Ventilation & Climate Maintenance' },
    { value: 'installation', label: '🪑 Office Furniture & Locks (Desks, Chairs, Doors)' },
    { value: 'inspection', label: '🚰 Plumbing & Water Fixtures (Pipes, Restroom, Leaks)' },
    { value: 'other', label: '🏢 Building, Painting & General Workplace Maintenance' },
  ],
};

const TITLE_PLACEHOLDERS = {
  it_support: 'e.g., Computer not turning on, Printer paper jam, Wi-Fi keeps disconnecting',
  sap: 'e.g., Authorization error on T-Code ME21N, Need access to SAP MM module',
  general: 'e.g., Air conditioner leaking water in Room 204, Broken chair wheel, Dead power socket',
};

const DESCRIPTION_PLACEHOLDERS = {
  it_support: 'Describe what happened, any error messages, and troubleshooting steps already tried...',
  sap: 'Describe the SAP module, error message or T-Code, and what operation you were trying to perform...',
  general: 'Describe the facility issue, specific room/floor location, urgency, and any safety hazards...',
};

function RequiredMark() {
  return <span className="text-destructive ml-0.5" aria-hidden="true">*</span>;
}

const Requests = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showHelpBanner, setShowHelpBanner] = useState(true);
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
  const [supportCategory, setSupportCategory] = useState<'it_support' | 'sap' | 'general'>(
    (categoryParam as 'it_support' | 'sap' | 'general') || 'it_support'
  );
  const [dismissedSuggestion, setDismissedSuggestion] = useState<string | null>(null);

  useEffect(() => {
    if (categoryParam && ['it_support', 'sap', 'general'].includes(categoryParam)) {
      setSupportCategory(categoryParam as 'it_support' | 'sap' | 'general');
    }
  }, [categoryParam]);

  useEffect(() => {
    setDismissedSuggestion(null);
  }, [supportCategory]);

  const smartSuggestion = useMemo(() => {
    const text = `${formData.title || ''} ${formData.description || ''}`.toLowerCase();
    if (!text.trim()) return null;

    const findMatch = (keywords: string[]) => {
      for (const kw of keywords) {
        const regex = new RegExp(`(^|[^a-z0-9])${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
        if (regex.test(text)) return kw;
      }
      return null;
    };

    // If currently NOT on SAP, but mentions SAP keywords:
    if (supportCategory !== 'sap') {
      const match = findMatch(SAP_KEYWORDS);
      if (match) {
        return {
          target: 'sap' as const,
          label: 'System Related Issue',
          keyword: match,
          icon: Database,
          colorClass: 'border-teal-500/40 bg-teal-500/10 text-teal-900 dark:text-teal-200',
          btnClass: 'bg-teal-600 hover:bg-teal-700 text-white',
          message: `Your request mentions "${match}". It appears to be related to the SAP ERP system.`,
        };
      }
    }

    // Facility / maintenance keywords when not already on Facility:
    if (supportCategory !== 'general') {
      const match = findMatch(FACILITY_KEYWORDS);
      if (match) {
        return {
          target: 'general' as const,
          label: 'Facility & Maintenance',
          keyword: match,
          icon: Wrench,
          colorClass: 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100',
          btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
          message: `Your request mentions "${match}". It looks like a facility or workplace maintenance issue.`,
        };
      }
    }

    // If currently on SAP, but mentions IT/Hardware keywords:
    if (supportCategory === 'sap') {
      const match = findMatch(IT_KEYWORDS);
      if (match) {
        return {
          target: 'it_support' as const,
          label: 'IT Support',
          keyword: match,
          icon: Monitor,
          colorClass: 'border-blue-500/40 bg-blue-500/10 text-blue-900 dark:text-blue-200',
          btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
          message: `Your request mentions "${match}". It appears to be a hardware or IT support issue.`,
        };
      }
    }

    // If on Facility but mentions IT keywords:
    if (supportCategory === 'general') {
      const match = findMatch(IT_KEYWORDS);
      if (match) {
        return {
          target: 'it_support' as const,
          label: 'IT Support',
          keyword: match,
          icon: Monitor,
          colorClass: 'border-blue-500/40 bg-blue-500/10 text-blue-900 dark:text-blue-200',
          btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
          message: `Your request mentions "${match}". It appears to be a hardware or IT support issue.`,
        };
      }
    }

    return null;
  }, [formData.title, formData.description, supportCategory]);

  const handleTypeChange = (val: string) => {
    setFormData((prev) => ({ ...prev, type: val as MaintenanceTicket['type'] }));
  };

  const [preferredDate, setPreferredDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] =
    useState<NonNullable<MaintenanceTicket['recurring_interval']>>('monthly');
  const [recurringEndsAt, setRecurringEndsAt] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [facilityRoom, setFacilityRoom] = useState('');

  const showAssetField = supportCategory === 'it_support' && ASSET_REQUIRED_TYPES.includes(
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
      <Card className="max-w-2xl mx-auto overflow-hidden border-t-4 border-t-teal-600 dark:border-t-teal-500 shadow-xl bg-card">
        <CardHeader className="relative overflow-hidden bg-gradient-to-b from-teal-500/5 via-transparent to-transparent pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </div>
              <CardTitle className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                <span className="bg-gradient-to-r from-teal-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                  New Support Request
                </span>
              </CardTitle>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 text-xs font-semibold self-start sm:self-auto">
              <Activity className="h-3 w-3 animate-pulse" />
              Live Assistance
            </div>
          </div>
          <CardDescription className="text-muted-foreground text-sm mt-2">
            Submit a request for IT support. Our team will review it and respond based on priority.
          </CardDescription>
          {showHelpBanner && (
            <div className="mt-4 rounded-lg border border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 relative pr-10">
              <p className="text-sm text-teal-800 dark:text-teal-300 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                Check the Help Center first — your question may already be answered.
              </p>
              <Button variant="outline" size="sm" asChild className="border-teal-500/30 text-teal-700 hover:bg-teal-500/10 dark:text-teal-300 self-start sm:self-auto">
                <Link to="/help">Browse FAQ</Link>
              </Button>
              <button
                type="button"
                className="absolute right-3 top-3.5 text-teal-600/60 hover:text-teal-600 dark:text-teal-400/60 dark:hover:text-teal-400"
                onClick={() => setShowHelpBanner(false)}
                title="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="title">Request Title<RequiredMark /></Label>
              <Input
                id="title"
                placeholder={TITLE_PLACEHOLDERS[supportCategory]}
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Support Department routing */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                Support Department<RequiredMark />
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {([
                  {
                    value: 'it_support',
                    label: 'IT Support',
                    desc: 'Hardware, software & network',
                    icon: Monitor,
                    normalStyle: 'border-blue-200 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 hover:bg-blue-100/70 dark:hover:bg-blue-900/40',
                    activeStyle: 'border-blue-500 bg-blue-100 dark:bg-blue-900/60 text-blue-950 dark:text-blue-50 ring-2 ring-blue-500/50 shadow-md',
                    iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-300',
                    activeIconBg: 'bg-blue-600 text-white shadow-xs',
                  },
                  {
                    value: 'sap',
                    label: 'System-Related Issue',
                    desc: 'SAP ERP, modules & access',
                    icon: Database,
                    normalStyle: 'border-teal-200 dark:border-teal-800/60 bg-teal-50/70 dark:bg-teal-950/30 text-teal-950 dark:text-teal-100 hover:bg-teal-100/70 dark:hover:bg-teal-900/40',
                    activeStyle: 'border-teal-500 bg-teal-100 dark:bg-teal-900/60 text-teal-950 dark:text-teal-50 ring-2 ring-teal-500/50 shadow-md',
                    iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-300',
                    activeIconBg: 'bg-teal-600 text-white shadow-xs',
                  },
                  {
                    value: 'general',
                    label: 'Facility & Maintenance',
                    desc: 'Electrical, plumbing, AC & furniture',
                    icon: Wrench,
                    normalStyle: 'border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100 hover:bg-amber-100/70 dark:hover:bg-amber-900/40',
                    activeStyle: 'border-amber-500 bg-amber-100 dark:bg-amber-900/60 text-amber-950 dark:text-amber-50 ring-2 ring-amber-500/50 shadow-md',
                    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
                    activeIconBg: 'bg-amber-600 text-white shadow-xs',
                  },
                ] as const).map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = supportCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setSupportCategory(cat.value)}
                      className={cn(
                        'relative group flex flex-col justify-between rounded-xl border p-2.5 text-left transition-all duration-200 ease-out',
                        'hover:-translate-y-0.5 hover:shadow-md focus:outline-none',
                        isSelected ? cat.activeStyle : cat.normalStyle
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5 w-full">
                        <div className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200',
                          isSelected ? cat.activeIconBg : cat.iconBg
                        )}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className={cn(
                          'h-4 w-4 rounded-full border flex items-center justify-center transition-all duration-200',
                          isSelected ? 'border-teal-600 bg-teal-600 text-white scale-105 shadow-2xs' : 'border-muted-foreground/30 opacity-40 group-hover:opacity-70'
                        )}>
                          {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold tracking-tight text-foreground">
                          {cat.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {cat.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Smart Keyword Detection Banner */}
              {smartSuggestion && dismissedSuggestion !== smartSuggestion.target && (
                <div className={cn(
                  'mt-2.5 p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200',
                  smartSuggestion.colorClass
                )}>
                  <div className="flex items-start sm:items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-background/80 shadow-2xs shrink-0 mt-0.5 sm:mt-0">
                      <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">
                        Smart Department Suggestion
                      </p>
                      <p className="text-xs opacity-90 mt-0.5">
                        {smartSuggestion.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      className={cn('h-7 px-3 text-xs gap-1 font-semibold shadow-2xs', smartSuggestion.btnClass)}
                      onClick={() => {
                        setSupportCategory(smartSuggestion.target);
                        toast({
                          title: 'Department Updated',
                          description: `Switched routing to ${smartSuggestion.label}.`,
                        });
                      }}
                    >
                      <smartSuggestion.icon className="h-3 w-3" />
                      Switch to {smartSuggestion.label}
                    </Button>
                    <button
                      type="button"
                      className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
                      onClick={() => setDismissedSuggestion(smartSuggestion.target)}
                      title="Keep current department"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-1">
                Your request will be automatically routed to the correct team based on this selection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Request Type<RequiredMark /></Label>
                <Select
                  required
                  value={formData.type}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(REQUEST_TYPES_BY_CATEGORY[supportCategory] || REQUEST_TYPES_BY_CATEGORY.it_support).map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
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

            {/* Room / Facility Area for General tickets */}
            {supportCategory === 'general' && (
              <div className="grid gap-2 animate-in fade-in duration-200">
                <Label htmlFor="facility-room">
                  Room / Office / Building Area <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                </Label>
                <Input
                  id="facility-room"
                  placeholder="e.g., Building A, 2nd Floor, Room 204 / Executive Conference Room"
                  value={facilityRoom}
                  onChange={(e) => setFacilityRoom(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Specify the exact room or area so the facility technician can locate it immediately.
                </p>
              </div>
            )}

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
                placeholder={DESCRIPTION_PLACEHOLDERS[supportCategory]}
                rows={5}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="attachments" className="text-sm font-semibold flex items-center justify-between">
                <span>Attachments</span>
                <span className="text-xs text-muted-foreground font-normal">Optional (Max 5 files, 5MB each)</span>
              </Label>
              <label
                htmlFor="attachments"
                className="block cursor-pointer rounded-xl border-2 border-dashed border-teal-500/30 bg-teal-50/30 dark:bg-teal-950/10 p-4 transition-all duration-200 hover:border-teal-500/60 hover:bg-teal-50/50"
              >
                <div className="flex flex-col items-center justify-center text-center py-2 space-y-2">
                  <div className="h-10 w-10 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-teal-700 dark:text-teal-300 hover:underline">
                      Click to upload files
                    </span>
                    <span className="text-xs text-muted-foreground"> or drag and drop</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Supports PNG, JPG, JPEG, and PDF documents
                  </p>
                  <Input
                    id="attachments"
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={handleFilesChange}
                  />
                </div>
                {attachments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-teal-500/15 space-y-2">
                    <p className="text-xs font-semibold text-teal-800 dark:text-teal-200">
                      Selected Files ({attachments.length}):
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachments.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between rounded-lg border border-teal-500/20 bg-background px-3 py-1.5 text-xs font-medium shadow-2xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="truncate mr-2 flex items-center gap-1.5">
                            <Paperclip className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                            {file.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAttachment(index);
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </label>
            </div>

            {!isUrgent && (
              <div className="grid gap-2">
                <Label htmlFor="preferred-date" className="text-sm font-semibold">Preferred Date</Label>
                <Input
                  id="preferred-date"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="rounded-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Optional — when you would prefer this to be scheduled.
                </p>
              </div>
            )}
            {isUrgent && (
              <p className="text-xs text-teal-800 dark:text-teal-300 rounded-lg border border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/20 px-3.5 py-2.5 flex items-center gap-2">
                <Info className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                Preferred date is hidden for High/Critical requests — our team will prioritize this immediately.
              </p>
            )}

            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-3.5">
              <div>
                <Label className="text-sm font-semibold">Recurring Request</Label>
                <p className="text-xs text-muted-foreground">
                  Schedule this request to automatically repeat on an interval
                </p>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
            {isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-teal-500/30 p-4 bg-teal-50/30 dark:bg-teal-950/10">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Frequency<RequiredMark /></Label>
                  <Select
                    value={recurringInterval}
                    onValueChange={(val) =>
                      setRecurringInterval(
                        val as NonNullable<MaintenanceTicket['recurring_interval']>
                      )
                    }
                  >
                    <SelectTrigger className="rounded-lg">
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
                  <Label htmlFor="recurring-ends" className="text-xs font-semibold">Ends on<RequiredMark /></Label>
                  <Input
                    id="recurring-ends"
                    type="date"
                    required={isRecurring}
                    value={recurringEndsAt}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setRecurringEndsAt(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border/60">
              <Button type="button" variant="outline" className="w-full sm:w-auto rounded-xl" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/35 transition-all duration-300 transform hover:-translate-y-0.5" disabled={createTicket.isPending}>
                {createTicket.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting Request...
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
        <DialogContent className="w-[95vw] sm:max-w-md text-center p-6 sm:p-8 border-none bg-card/95 backdrop-blur-md shadow-2xl rounded-2xl">
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
