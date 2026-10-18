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
import { useTickets, useCreateTicket } from '@/hooks/useTickets';
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge';
import { 
  Send, Loader2, Paperclip, X, Copy, ExternalLink, HelpCircle, Activity, 
  Monitor, Database, Wrench, Check, UploadCloud, FileText, MapPin, 
  Calendar as CalendarIcon, Repeat, Info, Clock, ShieldCheck, Sparkles, 
  ChevronRight, AlertTriangle, Layers, Tag, Eye, BookOpen, CheckCircle2,
  ArrowUpRight, Building2, User
} from 'lucide-react';
import { FormPageSkeleton } from '@/components/skeletons/FormPageSkeleton';
import { useToast } from '@/hooks/use-toast';
import type { MaintenanceTicket } from '@/integrations/laravel/client';
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

const DEPARTMENT_METADATA = {
  it_support: {
    title: 'IT & Hardware Support',
    desc: 'PC, Laptop, Monitor, Wi-Fi, Printer & Network',
    team: 'EEC IT Infrastructure & Helpdesk Team',
    tag: 'Hardware & Network',
    slaTime: 'Response < 2h',
    icon: Monitor,
    gradient: 'from-[#11adc4] via-[#0ea0b6] to-[#077d8f]',
    selectedRing: 'ring-4 ring-[#11adc4]/50 shadow-xl shadow-[#11adc4]/35 scale-[1.02] border-white',
    badgeClass: 'bg-[#11adc4]/20 text-[#074b58] dark:text-[#38d8ef] border-[#11adc4]/40 font-bold',
  },
  sap: {
    title: 'SAP ERP & Systems',
    desc: 'SAP Modules, T-Codes, Approvals & User Roles',
    team: 'Enterprise Applications & SAP Competency Center',
    tag: 'Business Applications',
    slaTime: 'Response < 3h',
    icon: Database,
    gradient: 'from-[#0f5766] via-[#0b4754] to-[#073640]',
    selectedRing: 'ring-4 ring-[#0f5766]/60 shadow-xl shadow-[#0f5766]/40 scale-[1.02] border-white',
    badgeClass: 'bg-[#0f5766]/20 text-[#0f5766] dark:text-[#7ce5f5] border-[#0f5766]/40 font-bold',
  },
  general: {
    title: 'Facility & Workplace',
    desc: 'AC, Electrical, Plumbing, Locks & Office Furniture',
    team: 'EEC Workplace Operations & Facilities Team',
    tag: 'Workplace Services',
    slaTime: 'Response < 4h',
    icon: Wrench,
    gradient: 'from-[#143e49] via-[#0f323c] to-[#09222a]',
    selectedRing: 'ring-4 ring-[#143e49]/60 shadow-xl shadow-[#143e49]/40 scale-[1.02] border-white',
    badgeClass: 'bg-[#143e49]/20 text-[#143e49] dark:text-[#7ce5f5] border-[#143e49]/40 font-bold',
  },
};

const PRIORITY_METADATA: Record<
  NonNullable<MaintenanceTicket['priority']>,
  {
    label: string;
    sublabel: string;
    timeframe: string;
    description: string;
    badgeStyle: string;
    pillStyle: string;
    activePillStyle: string;
    dotClass: string;
  }
> = {
  low: {
    label: 'Low',
    sublabel: '3–5 days',
    timeframe: 'within 3–5 business days',
    description: 'Routine maintenance and minor non-urgent inquiries.',
    badgeStyle: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
    pillStyle: 'border-border hover:border-slate-400 bg-card text-foreground',
    activePillStyle: 'border-slate-500 bg-slate-100 dark:bg-slate-850 text-slate-900 dark:text-slate-100 ring-2 ring-slate-400/50 font-bold shadow-xs',
    dotClass: 'bg-slate-400',
  },
  medium: {
    label: 'Medium',
    sublabel: '1–2 days',
    timeframe: 'within 24–48 hours',
    description: 'Standard technical issue impacting normal individual work.',
    badgeStyle: 'bg-[#11adc4]/15 text-[#074b58] dark:text-[#38d8ef] border-[#11adc4]/30',
    pillStyle: 'border-border hover:border-[#11adc4]/50 bg-card text-foreground',
    activePillStyle: 'border-[#11adc4] bg-[#11adc4]/15 text-[#074b58] dark:text-[#38d8ef] ring-2 ring-[#11adc4]/50 font-bold shadow-xs',
    dotClass: 'bg-[#11adc4]',
  },
  high: {
    label: 'High',
    sublabel: '< 4 hours',
    timeframe: 'within 4 hours',
    description: 'Urgent issue blocking key tasks or multiple team members.',
    badgeStyle: 'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30',
    pillStyle: 'border-border hover:border-amber-400 bg-card text-foreground',
    activePillStyle: 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/50 font-bold shadow-xs',
    dotClass: 'bg-amber-500',
  },
  critical: {
    label: 'Critical',
    sublabel: '< 2 hours',
    timeframe: 'within 2 hours (Immediate Escalation)',
    description: 'Major outage, complete system failure, or safety hazard.',
    badgeStyle: 'bg-rose-500/15 text-rose-800 dark:text-rose-200 border-rose-500/30',
    pillStyle: 'border-border hover:border-rose-400 bg-card text-foreground',
    activePillStyle: 'border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-100 ring-2 ring-rose-500/50 font-bold shadow-xs',
    dotClass: 'bg-rose-500 animate-ping',
  },
};

const SUGGESTED_FAQS = {
  it_support: [
    { title: 'Wi-Fi keeps dropping or will not authenticate', desc: 'Step-by-step 802.1x certificate & network reconnection guide', link: '/help' },
    { title: 'Printer offline or paper jam on Floor 2', desc: 'Quick spooler reset and toner check instructions', link: '/help' },
    { title: 'Setting up corporate email on Outlook mobile', desc: 'Server host and multi-factor setup instructions', link: '/help' },
  ],
  sap: [
    { title: 'How to request SAP ERP role or T-Code access', desc: 'Department manager approval requirements and form', link: '/help' },
    { title: 'SAP password locked or login expired', desc: 'Self-service unlock steps or immediate reset contact', link: '/help' },
    { title: 'Resolving transaction verification & invoice errors', desc: 'Standard posting procedures and GL verification', link: '/help' },
  ],
  general: [
    { title: 'Emergency water leak or electrical failure', desc: 'Direct 24/7 facility operations on-call line', link: '/help' },
    { title: 'Office HVAC temperature & ventilation adjustment', desc: 'Zone control policies and thermostat schedule', link: '/help' },
    { title: 'Office chair, drawer lock or desk repair requests', desc: 'Standard workplace ergonomics & repair turnaround', link: '/help' },
  ],
};

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
  const { data: allTickets = [] } = useTickets();
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

  const selectedLocation = useMemo(() => {
    return locations?.find((l) => l.id === locationId);
  }, [locations, locationId]);

  const selectedAsset = useMemo(() => {
    if (!formData.asset_id || formData.asset_id === 'none') return null;
    return assets?.find((a) => a.id === formData.asset_id);
  }, [assets, formData.asset_id]);

  const myRecentTickets = useMemo(() => {
    if (!allTickets || !Array.isArray(allTickets)) return [];
    return allTickets
      .filter((t) => (t.requester_id === profile?.id || t.created_by === profile?.id) && t.status !== 'closed' && t.status !== 'resolved')
      .slice(0, 3);
  }, [allTickets, profile?.id]);

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
        <FormPageSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Submit Request"
      subtitle="Create a new IT support request"
    >
      <div className="max-w-[1440px] mx-auto space-y-6 pb-12">
        {/* Top Notification / Help Center Banner */}
        {showHelpBanner && (
          <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-transparent px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs relative pr-12 transition-all">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 border border-teal-500/30">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Need an immediate answer?
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Check our Knowledge Base for self-service guides on Wi-Fi, printers, and SAP access before submitting.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <Button variant="outline" size="sm" asChild className="border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 text-xs font-semibold rounded-xl">
                <Link to="/help" className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Browse FAQs
                </Link>
              </Button>
            </div>
            <button
              type="button"
              className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setShowHelpBanner(false)}
              title="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Form Column (60-65% width) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <Card className="overflow-hidden shadow-md bg-card rounded-2xl border border-border/80">
              {/* Vibrant Top Accent Bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#11adc4] via-[#0f5766] to-[#11adc4]" />
              
              <CardHeader className="pb-4 pt-6 px-6 sm:px-8 border-b border-border/60 bg-gradient-to-b from-muted/20 to-transparent">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#11adc4]/20 to-[#0f5766]/20 border border-[#11adc4]/40 flex items-center justify-center text-[#0f5766] dark:text-[#11adc4] shadow-xs">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Create Support Request
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                        Submit a maintenance or technical ticket for rapid dispatch by our team.
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold self-start sm:self-auto border border-emerald-500/25">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Dispatch Active
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Step 1: Department Routing (Bento Cards) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 rounded-full bg-[#11adc4]/15 text-[#0f5766] dark:text-[#11adc4] text-xs font-bold items-center justify-center border border-[#11adc4]/30">
                          1
                        </span>
                        <Label className="text-sm font-bold tracking-tight text-foreground">
                          Support Department & Team<RequiredMark />
                        </Label>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
                        Auto-assigned to specialists
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {(['it_support', 'sap', 'general'] as const).map((catKey) => {
                        const meta = DEPARTMENT_METADATA[catKey];
                        const Icon = meta.icon;
                        const isSelected = supportCategory === catKey;

                        return (
                          <button
                            key={catKey}
                            type="button"
                            onClick={() => setSupportCategory(catKey)}
                            className={cn(
                              'relative group flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 ease-out text-white overflow-hidden',
                              'bg-gradient-to-br', meta.gradient,
                              isSelected
                                ? cn('border-white/90', meta.selectedRing)
                                : 'border-white/20 opacity-80 hover:opacity-100 hover:scale-[1.01] hover:shadow-lg shadow-md'
                            )}
                          >
                            {/* Subtle decorative glow overlay */}
                            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />

                            <div className="flex items-center justify-between w-full mb-3 relative z-10">
                              <div
                                className={cn(
                                  'flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 border',
                                  isSelected
                                    ? 'bg-white text-[#0f5766] border-white shadow-md'
                                    : 'bg-white/20 backdrop-blur-xs text-white border-white/30 group-hover:bg-white/30'
                                )}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div
                                className={cn(
                                  'h-6 w-6 rounded-full border flex items-center justify-center transition-all duration-200',
                                  isSelected
                                    ? 'border-white bg-white text-[#0f5766] scale-110 shadow-sm font-bold'
                                    : 'border-white/40 bg-white/10 opacity-70 group-hover:opacity-100'
                                )}
                              >
                                {isSelected ? (
                                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                                ) : (
                                  <span className="h-2 w-2 rounded-full bg-white/40 group-hover:bg-white/80" />
                                )}
                              </div>
                            </div>

                            <div className="relative z-10">
                              <p className="text-sm font-bold tracking-tight text-white drop-shadow-xs">
                                {meta.title}
                              </p>
                              <p className="text-xs text-white/85 leading-snug mt-1 line-clamp-2">
                                {meta.desc}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] relative z-10">
                              <span className="font-semibold text-white/90">
                                {meta.tag}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-lg font-bold text-[10px] bg-white/20 text-white border border-white/30 backdrop-blur-xs shadow-2xs">
                                {meta.slaTime}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Smart Keyword Detection Suggestion */}
                    {smartSuggestion && dismissedSuggestion !== smartSuggestion.target && (
                      <div className={cn(
                        'mt-3 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200',
                        smartSuggestion.colorClass
                      )}>
                        <div className="flex items-start sm:items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-background/90 shadow-2xs shrink-0 mt-0.5 sm:mt-0">
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
                  </div>

                  {/* Step 2: Request Scope & Priority */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 rounded-full bg-[#11adc4]/15 text-[#0f5766] dark:text-[#11adc4] text-xs font-bold items-center justify-center border border-[#11adc4]/30">
                        2
                      </span>
                      <Label className="text-sm font-bold tracking-tight text-foreground">
                        Request Details & Urgency<RequiredMark />
                      </Label>
                    </div>

                    {/* Request Title */}
                    <div className="space-y-1.5">
                      <Label htmlFor="title" className="text-xs font-semibold flex items-center justify-between">
                        <span>Subject / Short Summary<RequiredMark /></span>
                        <span className="text-[11px] text-muted-foreground font-normal">Clear and specific summary</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder={TITLE_PLACEHOLDERS[supportCategory]}
                        required
                        className="rounded-xl h-11 text-sm border-border focus-visible:ring-[#11adc4]/30 focus-visible:border-[#11adc4]"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>

                    {/* Priority Selector Pill Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Priority & Urgency<RequiredMark /></Label>
                        <span className="text-[11px] text-muted-foreground font-normal">Affects queue dispatch SLA</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {(['low', 'medium', 'high', 'critical'] as const).map((pKey) => {
                          const pMeta = PRIORITY_METADATA[pKey];
                          const isPSelected = formData.priority === pKey;

                          return (
                            <button
                              key={pKey}
                              type="button"
                              onClick={() => setFormData({ ...formData, priority: pKey })}
                              className={cn(
                                'flex flex-col items-start p-2.5 rounded-xl border text-left transition-all duration-150',
                                isPSelected ? pMeta.activePillStyle : pMeta.pillStyle
                              )}
                            >
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className="text-xs font-bold capitalize flex items-center gap-1.5">
                                  <span className={cn('h-2 w-2 rounded-full', pMeta.dotClass)} />
                                  {pMeta.label}
                                </span>
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                {pMeta.sublabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Request Type and Location Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Request Category Type<RequiredMark /></Label>
                        <Select
                          required
                          value={formData.type}
                          onValueChange={handleTypeChange}
                        >
                          <SelectTrigger className="rounded-xl h-11 text-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {(REQUEST_TYPES_BY_CATEGORY[supportCategory] || REQUEST_TYPES_BY_CATEGORY.it_support).map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Office / Location<RequiredMark /></Label>
                        <Combobox
                          options={locationOptions}
                          value={locationId}
                          onValueChange={setLocationId}
                          placeholder="Select office / branch"
                          emptyText="No locations configured"
                        />
                      </div>
                    </div>

                    {/* Room / Facility Area for General tickets */}
                    {supportCategory === 'general' && (
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <Label htmlFor="facility-room" className="text-xs font-semibold">
                          Room / Office / Building Area <span className="text-muted-foreground font-normal">(Optional)</span>
                        </Label>
                        <Input
                          id="facility-room"
                          placeholder="e.g., Building A, 2nd Floor, Room 204 / Executive Boardroom"
                          className="rounded-xl h-11 text-sm"
                          value={facilityRoom}
                          onChange={(e) => setFacilityRoom(e.target.value)}
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Specify the exact room or area so the facility technician can locate it immediately.
                        </p>
                      </div>
                    )}

                    {/* Related Asset Picker */}
                    {showAssetField && (
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <Label className="text-xs font-semibold">Related Asset</Label>
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
                        <p className="text-[11px] text-muted-foreground">
                          {role === 'requester'
                            ? 'Optional — only assets assigned to you by an admin appear here.'
                            : 'Optional — search by name, type, or serial number.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Description & File Attachments */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 rounded-full bg-[#11adc4]/15 text-[#0f5766] dark:text-[#11adc4] text-xs font-bold items-center justify-center border border-[#11adc4]/30">
                        3
                      </span>
                      <Label className="text-sm font-bold tracking-tight text-foreground">
                        Description & Attachments<RequiredMark />
                      </Label>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="description" className="text-xs font-semibold flex items-center justify-between">
                        <span>Detailed Description<RequiredMark /></span>
                        <span className="text-[11px] text-muted-foreground font-normal">
                          {formData.description?.length || 0} characters
                        </span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder={DESCRIPTION_PLACEHOLDERS[supportCategory]}
                        rows={5}
                        required
                        className="rounded-xl text-sm border-border focus-visible:ring-[#11adc4]/30 focus-visible:border-[#11adc4]"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    {/* File Attachment Dropzone */}
                    <div className="space-y-2">
                      <Label htmlFor="attachments" className="text-xs font-semibold flex items-center justify-between">
                        <span>Supporting Files & Screenshots</span>
                        <span className="text-[11px] text-muted-foreground font-normal">Optional (Max 5 files, 5MB each)</span>
                      </Label>
                      <label
                        htmlFor="attachments"
                        className="block cursor-pointer rounded-2xl border-2 border-dashed border-[#11adc4]/35 bg-[#11adc4]/5 dark:bg-[#11adc4]/5 p-5 transition-all duration-200 hover:border-[#11adc4] hover:bg-[#11adc4]/10"
                      >
                        <div className="flex flex-col items-center justify-center text-center py-2 space-y-2">
                          <div className="h-11 w-11 rounded-2xl bg-[#11adc4]/15 text-[#0f5766] dark:text-[#11adc4] flex items-center justify-center border border-[#11adc4]/30 shadow-2xs">
                            <UploadCloud className="h-6 w-6" />
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-[#0f5766] dark:text-[#38d8ef] hover:underline">
                              Click to upload attachments
                            </span>
                            <span className="text-xs text-muted-foreground"> or drag and drop</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Screenshots, logs, or photos (PNG, JPG, JPEG, PDF)
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
                          <div className="mt-3 pt-3 border-t border-[#11adc4]/20 space-y-2">
                            <p className="text-xs font-semibold text-[#0f5766] dark:text-[#7ce5f5]">
                              Attached Files ({attachments.length}):
                            </p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {attachments.map((file, index) => (
                                <li
                                  key={`${file.name}-${index}`}
                                  className="flex items-center justify-between rounded-xl border border-[#11adc4]/30 bg-background px-3 py-2 text-xs font-medium shadow-2xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="truncate mr-2 flex items-center gap-2">
                                    <Paperclip className="h-3.5 w-3.5 text-[#11adc4] shrink-0" />
                                    <span className="truncate">{file.name}</span>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                      ({(file.size / 1024).toFixed(0)} KB)
                                    </span>
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0 rounded-lg"
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

                    {/* Preferred Date & Recurring Options */}
                    {!isUrgent && (
                      <div className="space-y-1.5 pt-1">
                        <Label htmlFor="preferred-date" className="text-xs font-semibold">Preferred Service Date</Label>
                        <Input
                          id="preferred-date"
                          type="date"
                          value={preferredDate}
                          onChange={(e) => setPreferredDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="rounded-xl h-10 text-xs sm:text-sm max-w-xs"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Optional — when you would prefer technician maintenance to occur.
                        </p>
                      </div>
                    )}
                    {isUrgent && (
                      <p className="text-xs text-[#0f5766] dark:text-[#7ce5f5] rounded-xl border border-[#11adc4]/30 bg-[#11adc4]/10 px-3.5 py-2.5 flex items-center gap-2">
                        <Info className="h-4 w-4 text-[#11adc4] shrink-0" />
                        Preferred date is omitted for Urgent/Critical requests — assigned dispatch starts immediately.
                      </p>
                    )}

                    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-3.5">
                      <div>
                        <Label className="text-xs sm:text-sm font-semibold">Recurring Request Schedule</Label>
                        <p className="text-[11px] text-muted-foreground">
                          Schedule this maintenance task to repeat automatically
                        </p>
                      </div>
                      <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                    </div>

                    {isRecurring && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-[#11adc4]/30 p-4 bg-[#11adc4]/5">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Frequency<RequiredMark /></Label>
                          <Select
                            value={recurringInterval}
                            onValueChange={(val) =>
                              setRecurringInterval(
                                val as NonNullable<MaintenanceTicket['recurring_interval']>
                              )
                            }
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="recurring-ends" className="text-xs font-semibold">Ends on<RequiredMark /></Label>
                          <Input
                            id="recurring-ends"
                            type="date"
                            required={isRecurring}
                            value={recurringEndsAt}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setRecurringEndsAt(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border/60">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto rounded-xl h-11 px-5"
                      onClick={() => window.history.back()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="w-full sm:w-auto rounded-xl h-11 px-7 bg-gradient-to-r from-[#11adc4] to-[#0f5766] hover:opacity-95 text-white font-semibold shadow-md shadow-[#11adc4]/25 hover:shadow-lg transition-all duration-200"
                      disabled={createTicket.isPending}
                    >
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
          </div>

          {/* Right Column: Live Context & Ticket Preview (35-40% width, sticky) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-6">
            {/* 1. Live Ticket Preview Card */}
            <Card className="rounded-2xl border-2 border-[#11adc4]/40 bg-card shadow-lg overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/60 bg-gradient-to-r from-[#11adc4]/15 via-teal-500/10 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0f5766] dark:text-[#11adc4]">
                  <Eye className="h-4 w-4 text-[#11adc4]" />
                  Live Ticket Preview
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time
                </div>
              </div>

              <CardContent className="p-5 space-y-4">
                {/* Simulated Ticket Card */}
                <div className="rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground bg-background px-2.5 py-1 rounded-md border border-border/70">
                      #TKT-DRAFT
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('px-2.5 py-1 rounded-md text-[10px] font-bold border', DEPARTMENT_METADATA[supportCategory].badgeClass)}>
                        {DEPARTMENT_METADATA[supportCategory].title}
                      </span>
                      <span className={cn('px-2.5 py-1 rounded-md text-[10px] font-bold border', PRIORITY_METADATA[formData.priority || 'medium'].badgeStyle)}>
                        {PRIORITY_METADATA[formData.priority || 'medium'].label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-foreground tracking-tight leading-snug">
                      {formData.title ? formData.title : (
                        <span className="text-muted-foreground italic font-normal">
                          Enter a request title above...
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3 leading-relaxed">
                      {formData.description ? formData.description : (
                        <span className="italic opacity-60">
                          Description snippet will preview here in real time...
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 bg-background px-2 py-0.5 rounded-md border border-border/60">
                      <MapPin className="h-3 w-3 text-[#11adc4]" />
                      {selectedLocation ? selectedLocation.name : 'Location pending'}
                    </span>
                    {selectedAsset && (
                      <span className="flex items-center gap-1 bg-background px-2 py-0.5 rounded-md border border-border/60">
                        <Monitor className="h-3 w-3 text-teal-600" />
                        {selectedAsset.name}
                      </span>
                    )}
                    {attachments.length > 0 && (
                      <span className="flex items-center gap-1 bg-background px-2 py-0.5 rounded-md border border-border/60">
                        <Paperclip className="h-3 w-3 text-amber-600" />
                        {attachments.length} file(s)
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground text-center italic">
                  This preview mirrors how your ticket will appear in technician dispatch.
                </p>
              </CardContent>
            </Card>

            {/* 2. Guaranteed SLA & Routing Commitment */}
            <Card className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Service Level Commitment
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  SLA Active
                </span>
              </div>
              <CardContent className="p-5 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#11adc4]/20 to-[#0f5766]/20 border border-[#11adc4]/30 flex items-center justify-center text-[#0f5766] dark:text-[#11adc4] shrink-0 mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Target Response Time
                    </p>
                    <p className="text-sm font-extrabold text-[#0f5766] dark:text-[#38d8ef] mt-0.5">
                      {PRIORITY_METADATA[formData.priority || 'medium'].timeframe}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {PRIORITY_METADATA[formData.priority || 'medium'].description}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/70 text-xs space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#11adc4]" />
                    Routed Department:
                  </p>
                  <p className="text-muted-foreground text-[11px] pl-5">
                    {DEPARTMENT_METADATA[supportCategory].team}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 3. Quick Self-Help Knowledge Base Match */}
            <Card className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <HelpCircle className="h-4 w-4 text-[#11adc4]" />
                  Quick FAQs & Self-Service
                </div>
                <Link to="/help" className="text-[11px] text-[#11adc4] hover:underline font-semibold flex items-center gap-0.5">
                  View All <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <CardContent className="p-4 space-y-2">
                {SUGGESTED_FAQS[supportCategory].map((faq, i) => (
                  <Link
                    key={i}
                    to={faq.link}
                    className="group block p-2.5 rounded-xl border border-transparent hover:border-[#11adc4]/30 hover:bg-[#11adc4]/5 transition-all text-left"
                  >
                    <p className="text-xs font-semibold text-foreground group-hover:text-[#0f5766] dark:group-hover:text-[#38d8ef] flex items-center justify-between">
                      <span>{faq.title}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {faq.desc}
                    </p>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* 4. My Open Requests (Duplicate Prevention) */}
            {myRecentTickets.length > 0 && (
              <Card className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                    <Activity className="h-4 w-4 text-amber-500" />
                    Your Active Requests
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {myRecentTickets.length} pending
                  </span>
                </div>
                <CardContent className="p-4 space-y-2.5">
                  <p className="text-[11px] text-muted-foreground">
                    Avoid submitting duplicates — check your currently open requests:
                  </p>
                  {myRecentTickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {t.title}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {ticketReference(t.id)}
                        </p>
                      </div>
                      <TicketStatusBadge status={t.status} className="shrink-0 text-[10px] py-0.5 px-2" />
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" asChild className="w-full text-xs text-[#11adc4] hover:bg-[#11adc4]/10 mt-1">
                    <Link to="/tickets">View all your requests</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

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
