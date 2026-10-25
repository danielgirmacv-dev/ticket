import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useUsers, useCreateUser, useUpdateUserRole, AppRole, UserWithRole } from '@/hooks/useUsers';
import { useLocations } from '@/hooks/useLocations';
import { useDepartments } from '@/hooks/useDepartments';
import { useAuth } from '@/hooks/useAuth';
import { TablePageSkeleton } from '@/components/skeletons/TablePageSkeleton';
import {
  Plus, Search, UserPlus, Shield, Wrench, User as UserIcon, Mail, Building2, MapPin,
  MoreVertical, Edit, Trash2, Loader2, CheckCircle, XCircle, Clock, Upload, Download,
  Lock, LayoutGrid, List, Phone, Calendar, Copy, Check, RotateCcw, ShieldCheck, Sparkles,
  ExternalLink, Eye, X, Filter
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import laravelClient from '@/integrations/laravel/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api-error';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ProfessionalEmailInput } from '@/components/ui/professional-email-input';
import { validateEmail, normalizeEmail, isEmailValid } from '@/lib/email-validation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const roleStyles = {
  super_admin: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-200/80 dark:border-indigo-800/60',
    topBorder: 'border-t-indigo-500',
    cardGradient: 'from-indigo-500/10 via-purple-500/5 to-card border-indigo-500/30',
    icon: ShieldCheck,
  },
  admin: {
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-[#0f5766] dark:text-[#38d8ef]',
    border: 'border-[#11adc4]/30',
    topBorder: 'border-t-[#11adc4]',
    cardGradient: 'from-[#11adc4]/10 via-[#0f5766]/5 to-card border-[#11adc4]/30',
    icon: Shield,
  },
  technician: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200/80 dark:border-blue-800/60',
    topBorder: 'border-t-blue-500',
    cardGradient: 'from-blue-500/10 via-sky-500/5 to-card border-blue-500/30',
    icon: Wrench,
  },
  requester: {
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    topBorder: 'border-t-slate-400',
    cardGradient: 'from-slate-500/10 via-slate-500/5 to-card border-slate-400/30',
    icon: UserIcon,
  },
};

const roleDescriptions: Record<AppRole, string> = {
  super_admin: 'Full system administrative authority: oversees managers, technicians, equipment inventory, ticket routing, and user authorizations.',
  admin: 'Department operational manager: reviews support requests, coordinates team workflow, and assigns tasks to specialized technicians.',
  technician: 'Operational specialist: inspects issues, performs maintenance & repairs, and logs completion records.',
  requester: 'Staff member: submits maintenance work orders & support tickets, tracks resolution progress.',
};

const categoryBadge = (cat?: string | null) => {
  if (cat === 'it_support') {
    return { label: 'IT Support', icon: '🖥️', className: 'bg-[#11adc4]/10 text-[#0f5766] dark:text-[#38d8ef] border-[#11adc4]/30' };
  }
  if (cat === 'sap') {
    return { label: 'System & ERP', icon: '⚙️', className: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30' };
  }
  if (cat === 'general') {
    return { label: 'Facility', icon: '🏢', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' };
  }
  return null;
};

function getAvatarGradient(name: string) {
  const gradients = [
    'from-teal-500 to-emerald-600 text-white',
    'from-blue-500 to-indigo-600 text-white',
    'from-violet-500 to-purple-600 text-white',
    'from-amber-500 to-orange-600 text-white',
    'from-cyan-500 to-blue-600 text-white',
    'from-rose-500 to-pink-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

const roleLabel = (role: AppRole): string => {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'admin': return 'Manager';
    case 'technician': return 'Technician';
    case 'requester': return 'Requester';
    default: return role;
  }
};

const ALL_ASSIGNABLE_ROLES: AppRole[] = ['super_admin', 'admin', 'technician', 'requester'];
const MANAGER_ASSIGNABLE_ROLES: AppRole[] = ['technician'];

const Users = () => {
  const queryClient = useQueryClient();
  const { role: currentRole, profile } = useAuth();
  const isSuperAdmin = currentRole === 'super_admin';
  const isManager = currentRole === 'admin';
  const assignableRoles = isSuperAdmin ? ALL_ASSIGNABLE_ROLES : MANAGER_ASSIGNABLE_ROLES;

  const isSapEntity = (dept?: string | null, name?: string | null, email?: string | null) => {
    const text = `${dept || ''} ${name || ''} ${email || ''}`.toLowerCase();
    return text.includes('sap') || text.includes('erp');
  };
  const isFacilityEntity = (dept?: string | null, name?: string | null, email?: string | null) => {
    const text = `${dept || ''} ${name || ''} ${email || ''}`.toLowerCase();
    return text.includes('facility') || text.includes('facilities') || text.includes('maintenance') || text.includes('general') || text.includes('workplace');
  };
  const isSapManager = isSapEntity(profile?.department, profile?.name, profile?.email);
  const isFacilityManager = isFacilityEntity(profile?.department, profile?.name, profile?.email);
  const managerDepartment = profile?.department || (isSapManager ? 'System & ERP Support' : isFacilityManager ? 'Facility & Maintenance' : 'IT Support');

  const canManageUser = (user: UserWithRole) => {
    if (isSuperAdmin) return true;
    // Managers cannot manage requesters (locked) or other managers/admins
    return user.role === 'technician';
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserForSheet, setSelectedUserForSheet] = useState<UserWithRole | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyEmail = (e: React.MouseEvent, email: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Bulk CSV Import state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const downloadUserCsvTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      'Name,Email,Role,Department,Phone,Password\n' +
      'Abebe Kebede,abebe@example.com,requester,IT Support,+251911223344,Password123!\n' +
      'Tigist Haile,tigist@example.com,technician,Maintenance,+251922334455,Password123!\n' +
      'Dawit Alemu,dawit@example.com,admin,Management,+251933445566,Password123!';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'users_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkImportUsers = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file to import.');
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        toast.error('Failed to read CSV file.');
        setIsImporting(false);
        return;
      }

      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length <= 1) {
        toast.error('CSV file is empty or missing data rows.');
        setIsImporting(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIdx = headers.indexOf('name');
      const emailIdx = headers.indexOf('email');
      const roleIdx = headers.indexOf('role');
      const deptIdx = headers.indexOf('department');
      const phoneIdx = headers.indexOf('phone');
      const passIdx = headers.indexOf('password');

      if (nameIdx === -1 || emailIdx === -1) {
        toast.error('CSV must contain at least "Name" and "Email" columns.');
        setIsImporting(false);
        return;
      }

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''));
        if (row.length < 2 || !row[emailIdx]) continue;

        const name = row[nameIdx] || '';
        const rawEmail = row[emailIdx] || '';
        const email = normalizeEmail(rawEmail);

        if (!isEmailValid(email)) {
          failedCount++;
          errors.push(`Row ${i + 1} (${rawEmail}): Invalid email address format`);
          continue;
        }

        const roleStr = (row[roleIdx] || 'requester').toLowerCase();
        const role = (ALL_ASSIGNABLE_ROLES.includes(roleStr as AppRole) ? roleStr : 'requester') as AppRole;
        const department = row[deptIdx] || '';
        const phone = row[phoneIdx] || '';
        const password = row[passIdx] || 'Password123!';

        try {
          await createUser.mutateAsync({
            name,
            email,
            password,
            role,
            department: department || undefined,
            phone: phone || undefined,
            location_id: profile?.location_id || undefined,
          });
          successCount++;
        } catch (err: any) {
          failedCount++;
          errors.push(`Row ${i + 1} (${email}): ${getApiErrorMessage(err, 'Failed to create user')}`);
        }
      }

      setImportResults({ success: successCount, failed: failedCount, errors });
      setIsImporting(false);
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} user(s).`);
        queryClient.invalidateQueries({ queryKey: ['users'] });
      }
    };
    reader.readAsText(csvFile);
  };

  const { data: users, isLoading } = useUsers();
  const { data: locations } = useLocations();
  const { data: departments } = useDepartments();
  const createUser = useCreateUser();
  const updateUserRole = useUpdateUserRole();

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: (isManager ? 'technician' : 'requester') as AppRole,
    department: '',
    support_category: '' as '' | 'it_support' | 'sap' | 'general',
    location_id: 'none',
    password: '',
    phone: '',
  });

  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'requester' as AppRole,
    department: '',
    support_category: '' as '' | 'it_support' | 'sap' | 'general',
    location_id: 'none',
  });

  const handleCreateUser = async () => {
    const cleanEmail = normalizeEmail(newUser.email);
    const emailValidation = validateEmail(cleanEmail);
    if (!emailValidation.isValid) {
      toast.error(emailValidation.error || 'Please enter a valid email address');
      return;
    }

    try {
      await createUser.mutateAsync({
        ...newUser,
        email: cleanEmail,
        location_id: newUser.location_id === 'none' ? undefined : newUser.location_id,
        phone: newUser.phone || undefined,
        support_category: newUser.support_category || undefined,
      });
      setIsDialogOpen(false);
      setNewUser({
        name: '',
        email: '',
        role: (isManager ? 'technician' : 'requester') as AppRole,
        department: '',
        support_category: '',
        location_id: 'none',
        password: '',
        phone: '',
      });
    } catch {
      // Error toast is handled in useCreateUser
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: AppRole) => {
    await updateUserRole.mutateAsync({ userId, role: newRole });
  };

  const handleEditUser = (user: UserWithRole) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || '',
      support_category: (user as any).support_category || '',
      location_id: user.location_id || 'none',
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !canManageUser(editingUser)) return;

    try {
      // Update user role
      await handleRoleUpdate(editingUser.id, editFormData.role);

      // Update profile fields
      const profileUpdates: {
        name?: string;
        email?: string;
        department?: string;
        support_category?: string | null;
        location_id?: string | null;
      } = {};
      if (editFormData.name !== editingUser.name) profileUpdates.name = editFormData.name;
      if (editFormData.email !== editingUser.email) {
        const cleanEmail = normalizeEmail(editFormData.email);
        const emailValidation = validateEmail(cleanEmail);
        if (!emailValidation.isValid) {
          toast.error(emailValidation.error || 'Please enter a valid email address');
          return;
        }
        profileUpdates.email = cleanEmail;
      }
      if (editFormData.department !== (editingUser.department || '')) {
        profileUpdates.department = editFormData.department;
      }
      const existingSupportCat = (editingUser as any).support_category || '';
      if (editFormData.support_category !== existingSupportCat) {
        profileUpdates.support_category = editFormData.support_category || null;
      }
      if (editFormData.location_id !== (editingUser.location_id || 'none')) {
        profileUpdates.location_id = editFormData.location_id === 'none' ? null : editFormData.location_id;
      }
      if (Object.keys(profileUpdates).length > 0) {
        await laravelClient.put(`/profiles/${editingUser.id}`, profileUpdates);
      }

      toast.success('User updated successfully');
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error('Failed to update user');
      console.error(error);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await laravelClient.post(`/users/${userId}/approve`);
      toast.success('User approved successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to approve user'));
      console.error(error);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await laravelClient.post(`/users/${userId}/reject`);
      toast.success('User rejected');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to reject user'));
      console.error(error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await laravelClient.delete(`/profiles/${userId}`);
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete user'));
      console.error(error);
    }
  };

  const visibleUsers = users?.filter(user => {
    if (isManager && !isSuperAdmin) {
      // 1. Hide other managers — manager can only see their own account
      if (user.role === 'admin') {
        const isSelf = user.user_id === profile?.user_id || user.id === profile?.id || (!!user.email && user.email.toLowerCase() === profile?.email?.toLowerCase());
        if (!isSelf) return false;
      }

      // 2. Technicians: only technicians of this manager's domain
      if (user.role === 'technician') {
        const isTechSap = isSapEntity(user.department, user.name, user.email);
        const isTechFacility = isFacilityEntity(user.department, user.name, user.email);

        if (isSapManager) {
          return isTechSap;
        }
        if (isFacilityManager) {
          return isTechFacility;
        }
        // IT Support Manager: only IT technicians (neither SAP nor Facility)
        return !isTechSap && !isTechFacility;
      }
    }
    return true;
  }) || [];

  const usersByRole = visibleUsers.reduce(
    (acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    },
    { super_admin: 0, admin: 0, technician: 0, requester: 0 } as Record<AppRole, number>
  );

  const filteredUsers = (visibleUsers.filter(user => {
    const matchesSearch =
      (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || user.location_id === locationFilter;
    return matchesSearch && matchesRole && matchesStatus && matchesLocation;
  })).sort((a, b) => {
    // Pending users always at top
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    // Then newest first
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const pendingCount = visibleUsers.filter(u => u.status === 'pending').length;
  const isFiltered = searchQuery !== '' || roleFilter !== 'all' || statusFilter !== 'all' || locationFilter !== 'all';
  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
    setLocationFilter('all');
  };

  if (isLoading) {
    return (
      <DashboardLayout title="User Directory & Access Control" subtitle="Manage user credentials, security roles, and authorizations">
        <TablePageSkeleton statCardsCount={5} columnsCount={7} rowsCount={7} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="User Directory & Access Control"
      subtitle="Manage team credentials, security roles, department assignments, and approvals"
    >
      {/* Scoped Manager Notice */}
      {isManager && !isSuperAdmin && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-primary/25 bg-primary/5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
            <span>
              Scoped Management View: Displaying <strong>{managerDepartment}</strong> technicians and staff requesters. Other department managers are hidden.
            </span>
          </div>
          <Badge variant="outline" className="text-[11px] border-primary/30 text-primary font-medium w-fit">
            {managerDepartment}
          </Badge>
        </div>
      )}

      {/* Pending Account Approvals Alert Banner */}
      {pendingCount > 0 && (
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:border-amber-700/60 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                {pendingCount} Account{pendingCount > 1 ? 's' : ''} Awaiting Administrative Approval
                <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-800 text-[11px] bg-amber-50 dark:bg-amber-950/50">
                  Action Required
                </Badge>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSuperAdmin
                  ? 'New registrations must be approved by a Super Administrator before users can log in.'
                  : 'New registrations require Super Administrator approval before access is granted.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              className={cn(
                "h-8 text-xs font-medium",
                statusFilter === 'pending'
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
              )}
              onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              {statusFilter === 'pending' ? 'Showing Pending' : 'Filter Pending'}
            </Button>
          </div>
        </div>
      )}

      {/* Interactive Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-5">
        {/* Total Directory */}
        <Card
          className={cn(
            'relative overflow-hidden cursor-pointer rounded-xl border transition-all duration-200 bg-card shadow-2xs hover:shadow-md border-t-4 border-t-primary',
            roleFilter === 'all' && statusFilter === 'all'
              ? 'ring-2 ring-primary/80 border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
              : 'border-border/70 hover:border-primary/40'
          )}
          onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}
        >
          <CardContent className="p-4 sm:p-4.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Directory</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <UserIcon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-none">{visibleUsers.length}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">All active profiles</p>
          </CardContent>
        </Card>

        {/* Managers */}
        <Card
          className={cn(
            'relative overflow-hidden cursor-pointer rounded-xl border transition-all duration-200 bg-card shadow-2xs hover:shadow-md border-t-4 border-t-[#11adc4]',
            roleFilter === 'admin'
              ? 'ring-2 ring-[#11adc4] border-[#11adc4] bg-[#11adc4]/5 dark:bg-[#11adc4]/10 shadow-sm'
              : 'border-border/70 hover:border-[#11adc4]/40'
          )}
          onClick={() => { setRoleFilter(roleFilter === 'admin' ? 'all' : 'admin'); setStatusFilter('all'); }}
        >
          <CardContent className="p-4 sm:p-4.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Managers</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#11adc4]/10 text-[#0f5766] dark:text-[#38d8ef] border border-[#11adc4]/20">
                <Shield className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-none">
              {usersByRole.admin + (isSuperAdmin ? usersByRole.super_admin : 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {isSuperAdmin ? `${usersByRole.super_admin} Super / ${usersByRole.admin} Dept` : 'Department manager'}
            </p>
          </CardContent>
        </Card>

        {/* Technicians */}
        <Card
          className={cn(
            'relative overflow-hidden cursor-pointer rounded-xl border transition-all duration-200 bg-card shadow-2xs hover:shadow-md border-t-4 border-t-blue-500',
            roleFilter === 'technician'
              ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-sm'
              : 'border-border/70 hover:border-blue-500/40'
          )}
          onClick={() => { setRoleFilter(roleFilter === 'technician' ? 'all' : 'technician'); setStatusFilter('all'); }}
        >
          <CardContent className="p-4 sm:p-4.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Technicians</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Wrench className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-none">{usersByRole.technician}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {isManager ? `${managerDepartment}` : 'Support & field team'}
            </p>
          </CardContent>
        </Card>

        {/* Requesters */}
        <Card
          className={cn(
            'relative overflow-hidden cursor-pointer rounded-xl border transition-all duration-200 bg-card shadow-2xs hover:shadow-md border-t-4 border-t-slate-400',
            roleFilter === 'requester'
              ? 'ring-2 ring-slate-400 border-slate-400 bg-slate-100/60 dark:bg-slate-800/40 shadow-sm'
              : 'border-border/70 hover:border-slate-400/40'
          )}
          onClick={() => { setRoleFilter(roleFilter === 'requester' ? 'all' : 'requester'); setStatusFilter('all'); }}
        >
          <CardContent className="p-4 sm:p-4.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Requesters</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
                <UserIcon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-none">{usersByRole.requester}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">Protected staff accounts</p>
          </CardContent>
        </Card>

        {/* Pending Review */}
        <Card
          className={cn(
            'relative overflow-hidden cursor-pointer rounded-xl border transition-all duration-200 bg-card shadow-2xs hover:shadow-md border-t-4 border-t-amber-500 col-span-2 lg:col-span-1',
            statusFilter === 'pending'
              ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50 dark:bg-amber-950/20 shadow-sm'
              : 'border-border/70 hover:border-amber-500/40'
          )}
          onClick={() => { setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending'); }}
        >
          <CardContent className="p-4 sm:p-4.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Review</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Clock className={cn("h-4 w-4", pendingCount > 0 && "animate-pulse text-amber-500")} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-none">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {pendingCount > 0 ? (isSuperAdmin ? 'Requires approval' : 'Awaiting Super Admin') : 'All accounts verified'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segmented Quick Role Pills & Controls Toolbar */}
      <div className="space-y-3 mb-5">
        {/* Quick Filter Segmented Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Button
            type="button"
            size="sm"
            variant={roleFilter === 'all' && statusFilter === 'all' ? 'default' : 'outline'}
            className="h-8 rounded-full text-xs font-medium px-3.5"
            onClick={() => { setRoleFilter('all'); setStatusFilter('all'); }}
          >
            All Users ({visibleUsers.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={roleFilter === 'technician' ? 'default' : 'outline'}
            className="h-8 rounded-full text-xs font-medium px-3.5"
            onClick={() => { setRoleFilter(roleFilter === 'technician' ? 'all' : 'technician'); }}
          >
            <Wrench className="h-3.5 w-3.5 mr-1 text-blue-500" />
            Technicians ({usersByRole.technician})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={roleFilter === 'requester' ? 'default' : 'outline'}
            className="h-8 rounded-full text-xs font-medium px-3.5"
            onClick={() => { setRoleFilter(roleFilter === 'requester' ? 'all' : 'requester'); }}
          >
            <UserIcon className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Requesters ({usersByRole.requester})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={roleFilter === 'admin' ? 'default' : 'outline'}
            className="h-8 rounded-full text-xs font-medium px-3.5"
            onClick={() => { setRoleFilter(roleFilter === 'admin' ? 'all' : 'admin'); }}
          >
            <Shield className="h-3.5 w-3.5 mr-1 text-[#11adc4]" />
            Managers ({usersByRole.admin + (isSuperAdmin ? usersByRole.super_admin : 0)})
          </Button>
          {pendingCount > 0 && (
            <Button
              type="button"
              size="sm"
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              className={cn(
                "h-8 rounded-full text-xs font-medium px-3.5",
                statusFilter === 'pending'
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
              )}
              onClick={() => { setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending'); }}
            >
              <Clock className="h-3.5 w-3.5 mr-1 animate-pulse" />
              Pending ({pendingCount})
            </Button>
          )}
        </div>

        {/* Search & Actions Toolbar */}
        <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
          <div className="flex flex-1 flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-card"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[115px] sm:w-[125px] h-9 text-xs bg-card">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[120px] sm:w-[135px] h-9 text-xs bg-card">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                title="Reset all filters"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
              <Button
                type="button"
                size="sm"
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                className={cn("h-7 px-2.5 text-xs font-medium rounded-md", viewMode === 'table' ? "shadow-2xs" : "text-muted-foreground")}
                onClick={() => setViewMode('table')}
              >
                <List className="h-3.5 w-3.5 mr-1" />
                Table
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                className={cn("h-7 px-2.5 text-xs font-medium rounded-md", viewMode === 'grid' ? "shadow-2xs" : "text-muted-foreground")}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-1" />
                Cards
              </Button>
            </div>

            {/* Bulk CSV Import Dialog */}
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 text-xs">
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Bulk Import
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    Bulk Import Users
                  </DialogTitle>
                  <DialogDescription>
                    Upload a CSV file to create multiple user accounts at once.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Button variant="outline" onClick={downloadUserCsvTemplate} className="w-full justify-center">
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                  <div className="grid gap-2">
                    <Label htmlFor="user-csv-file">Select CSV File</Label>
                    <Input
                      id="user-csv-file"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    />
                    {csvFile && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {csvFile.name}
                      </p>
                    )}
                  </div>
                  {importResults && (
                    <div className={cn(
                      "p-3 rounded-lg border text-xs space-y-1",
                      importResults.failed > 0 ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
                    )}>
                      <p className="font-semibold text-foreground">
                        Import Results: {importResults.success} succeeded, {importResults.failed} failed
                      </p>
                      {importResults.errors.length > 0 && (
                        <ul className="max-h-28 overflow-y-auto space-y-1 text-destructive font-mono text-[11px] pt-1">
                          {importResults.errors.map((err, idx) => (
                            <li key={idx}>• {err}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkImportUsers} disabled={!csvFile || isImporting} className="bg-teal-600 hover:bg-teal-700 text-white font-semibold">
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Importing...
                      </>
                    ) : (
                      'Import Users'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add User Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 text-xs bg-gradient-to-r from-[#11adc4] to-[#0f5766] hover:opacity-95 text-white font-semibold shadow-xs">
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  {isManager ? 'Add Technician' : 'Add User'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {isManager ? `👷 Add Technician (${managerDepartment})` : 'Add New User'}
                  </DialogTitle>
                  <DialogDescription>
                    {isManager
                      ? `Create a specialized technician account under your ${managerDepartment} team.`
                      : 'Create a new user account with role assignment.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Full Name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>
                  <ProfessionalEmailInput
                    id="email"
                    label="Email Address"
                    placeholder="e.g., john@company.com"
                    value={newUser.email}
                    onChange={(email) => setNewUser({ ...newUser, email })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(val: AppRole) => {
                          const updates: Partial<typeof newUser> = { role: val };
                          if (isManager && val === 'technician') {
                            updates.department = managerDepartment;
                          }
                          setNewUser({ ...newUser, ...updates });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignableRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {roleLabel(role)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Department</Label>
                      <Select
                        value={newUser.department || 'none'}
                        onValueChange={(val: string) => setNewUser({ ...newUser, department: val === 'none' ? '' : val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Support Category — only visible when creating an admin/manager */}
                  {newUser.role === 'admin' && (
                    <div className="grid gap-2">
                      <Label>
                        Support Category
                        <span className="ml-1 text-xs text-amber-500 font-medium">(Required for managers)</span>
                      </Label>
                      <Select
                        value={newUser.support_category || 'none'}
                        onValueChange={(val) =>
                          setNewUser({ ...newUser, support_category: val === 'none' ? '' : val as any })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select support category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Not assigned —</SelectItem>
                          <SelectItem value="it_support">🖥️ IT Support</SelectItem>
                          <SelectItem value="sap">⚙️ System & ERP</SelectItem>
                          <SelectItem value="general">🏢 General / Facility</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Determines which ticket category routes to this manager.
                      </p>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label>Location</Label>
                    <Select
                      value={newUser.location_id}
                      onValueChange={(val: string) => setNewUser({ ...newUser, location_id: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {locations?.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g. +251911223344"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter temporary password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} disabled={createUser.isPending} className="bg-gradient-to-r from-[#11adc4] to-[#0f5766] text-white">
                    {createUser.isPending ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* VIEW MODE: TABLE VIEW */}
      {viewMode === 'table' && (
        <Card className="rounded-xl border border-border/80 shadow-2xs overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40">
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email & Contact</th>
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Domain</th>
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
                    <th className="py-3 px-4 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Joined</th>
                    <th className="py-3 px-4 text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.map((user, index) => {
                    const roleStyle = roleStyles[user.role];
                    const RoleIcon = roleStyle.icon;
                    const cat = categoryBadge(
                      (user as any).support_category ||
                      (isSapEntity(user.department) ? 'sap' : isFacilityEntity(user.department) ? 'general' : 'it_support')
                    );
                    const isSelf = user.user_id === profile?.user_id || user.id === profile?.id;
                    const initials = (user.name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                    return (
                      <tr
                        key={user.id}
                        className="animate-slide-up hover:bg-muted/30 transition-colors group cursor-pointer"
                        style={{ animationDelay: `${index * 30}ms` }}
                        onClick={() => setSelectedUserForSheet(user)}
                      >
                        {/* Member / Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-xs shadow-2xs", getAvatarGradient(user.name))}>
                                {initials}
                              </div>
                              <span className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                                user.status === 'active' ? "bg-emerald-500" : user.status === 'pending' ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                              )} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground text-sm truncate">{user.name}</span>
                                {isSelf && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-teal-500/30 text-teal-600 bg-teal-500/10 font-normal">
                                    You
                                  </Badge>
                                )}
                              </div>
                              {user.phone && (
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-2.5 w-2.5" />
                                  {user.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-foreground">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                            <span className="truncate max-w-[170px]">{user.email}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyEmail(e, user.email, user.id)}
                              className="text-muted-foreground/60 hover:text-foreground p-0.5 rounded transition-colors"
                              title="Copy email"
                            >
                              {copiedId === user.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          {canManageUser(user) ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Badge className={cn('gap-1.5 border cursor-pointer hover:opacity-85 font-medium shadow-2xs text-xs', roleStyle.bg, roleStyle.text, roleStyle.border)}>
                                  <RoleIcon className="h-3 w-3" />
                                  <span className="capitalize">{roleLabel(user.role)}</span>
                                </Badge>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {assignableRoles.map((role) => (
                                  <DropdownMenuItem key={role} onClick={() => handleRoleUpdate(user.id, role)}>
                                    {roleLabel(role)}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Badge className={cn('gap-1.5 border font-medium shadow-2xs text-xs', roleStyle.bg, roleStyle.text, roleStyle.border)}>
                              <RoleIcon className="h-3 w-3" />
                              <span className="capitalize">{roleLabel(user.role)}</span>
                            </Badge>
                          )}
                        </td>

                        {/* Domain / Category */}
                        <td className="py-3 px-4">
                          {cat ? (
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium", cat.className)}>
                              <span>{cat.icon}</span>
                              <span>{cat.label}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50 text-xs">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {user.status === 'pending' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending
                            </span>
                          )}
                          {user.status === 'active' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}
                          {user.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Rejected
                            </span>
                          )}
                        </td>

                        {/* Department */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                            <span className="truncate max-w-[130px]">{user.department || '—'}</span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                            <span className="truncate max-w-[130px]">{user.location?.name || '—'}</span>
                          </div>
                        </td>

                        {/* Joined */}
                        <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick View Profile Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="View details"
                              onClick={() => setSelectedUserForSheet(user)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {/* Super Admin Quick Approve */}
                            {user.status === 'pending' && isSuperAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs font-semibold text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-2xs"
                                onClick={() => handleApproveUser(user.user_id.toString())}
                              >
                                <CheckCircle className="h-3 w-3 mr-1 text-emerald-600 dark:text-emerald-400" />
                                Approve
                              </Button>
                            )}

                            {canManageUser(user) ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedUserForSheet(user)}>
                                    <Eye className="h-3.5 w-3.5 mr-2" />
                                    View Full Profile
                                  </DropdownMenuItem>
                                  {user.status === 'pending' && (
                                    <>
                                      <DropdownMenuItem onClick={() => handleApproveUser(user.user_id.toString())} className="text-success">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve User
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleRejectUser(user.user_id.toString())} className="text-destructive">
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject User
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                    <Edit className="h-3.5 w-3.5 mr-2" />
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive">
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <>
                                {user.status === 'pending' && !isSuperAdmin && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                                    <Clock className="h-3 w-3" />
                                    Super Admin
                                  </span>
                                )}
                                {user.role === 'requester' ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/75 px-2 py-0.5 rounded-md border border-dashed border-border bg-muted/30 font-medium" title="Requesters are locked from manager editing">
                                    <Lock className="h-3 w-3 text-amber-500" />
                                    Locked
                                  </span>
                                ) : user.role === 'admin' ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-md border border-teal-500/25 bg-teal-500/10 font-medium">
                                    <UserIcon className="h-3 w-3" />
                                    You
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 px-2 py-0.5 rounded-md border border-dashed border-muted-foreground/20">
                                    <Shield className="h-3 w-3" />
                                    Protected
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VIEW MODE: GRID / CARDS VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user, index) => {
            const roleStyle = roleStyles[user.role];
            const RoleIcon = roleStyle.icon;
            const cat = categoryBadge(
              (user as any).support_category ||
              (isSapEntity(user.department) ? 'sap' : isFacilityEntity(user.department) ? 'general' : 'it_support')
            );
            const isSelf = user.user_id === profile?.user_id || user.id === profile?.id;
            const initials = (user.name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const manageable = canManageUser(user);

            return (
              <Card
                key={user.id}
                className={cn(
                  "relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs hover:shadow-md transition-all duration-200 hover:border-primary/40 border-t-4",
                  roleStyle.topBorder
                )}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <CardContent className="p-4 flex flex-col gap-3.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-sm shadow-2xs", getAvatarGradient(user.name))}>
                          {initials}
                        </div>
                        <span className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                          user.status === 'active' ? "bg-emerald-500" : user.status === 'pending' ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                        )} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-semibold text-sm text-foreground truncate">{user.name}</h4>
                          {isSelf && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-teal-500/30 text-teal-600 bg-teal-500/10 font-normal">
                              You
                            </Badge>
                          )}
                        </div>
                        <Badge className={cn('gap-1 border font-medium text-[11px] mt-1', roleStyle.bg, roleStyle.text, roleStyle.border)}>
                          <RoleIcon className="h-3 w-3" />
                          <span className="capitalize">{roleLabel(user.role)}</span>
                        </Badge>
                      </div>
                    </div>

                    {/* Status pill in top-right */}
                    {user.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Contact Info & Chips */}
                  <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/60">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopyEmail(e, user.email, user.id)}
                        className="text-muted-foreground/60 hover:text-foreground shrink-0 p-1 rounded"
                        title="Copy email"
                      >
                        {copiedId === user.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>

                    {user.phone && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                        <span>{user.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
                      <span className="flex items-center gap-1 truncate text-foreground/80">
                        <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{user.department || '—'}</span>
                      </span>
                      <span className="flex items-center gap-1 truncate text-muted-foreground shrink-0">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[90px]">{user.location?.name || '—'}</span>
                      </span>
                    </div>

                    {cat && (
                      <div className="pt-1">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium", cat.className)}>
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      Joined {format(new Date(user.created_at), 'MMM yyyy')}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedUserForSheet(user)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Profile
                      </Button>

                      {user.status === 'pending' && isSuperAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs font-semibold text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          onClick={() => handleApproveUser(user.user_id.toString())}
                        >
                          <CheckCircle className="h-3 w-3 mr-1 text-emerald-600" />
                          Approve
                        </Button>
                      )}

                      {manageable ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="h-3.5 w-3.5 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive">
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : user.role === 'requester' && isManager ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/75 px-1.5 py-0.5 rounded border border-dashed border-border bg-muted/30">
                          <Lock className="h-3 w-3 text-amber-500" />
                          Locked
                        </span>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border bg-card/50">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-3">
            <UserIcon className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold mb-1">No users match your criteria</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Try adjusting your search terms, changing the role filter, or resetting all search filters.
          </p>
          {isFiltered && (
            <Button size="sm" variant="outline" onClick={handleResetFilters} className="text-xs">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset All Filters
            </Button>
          )}
        </div>
      )}

      {/* SLIDE-OVER USER PROFILE DRAWER (SHEET) */}
      <Sheet open={!!selectedUserForSheet} onOpenChange={(open) => !open && setSelectedUserForSheet(null)}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto p-6">
          {selectedUserForSheet && (() => {
            const roleStyle = roleStyles[selectedUserForSheet.role];
            const RoleIcon = roleStyle.icon;
            const cat = categoryBadge(
              (selectedUserForSheet as any).support_category ||
              (isSapEntity(selectedUserForSheet.department) ? 'sap' : isFacilityEntity(selectedUserForSheet.department) ? 'general' : 'it_support')
            );
            const isSelf = selectedUserForSheet.user_id === profile?.user_id || selectedUserForSheet.id === profile?.id;
            const manageable = canManageUser(selectedUserForSheet);

            return (
              <div className="space-y-6 pt-2">
                <SheetHeader className="text-left pb-4 border-b border-border/80">
                  <div className="flex items-center gap-4">
                    <div className={cn("relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm text-lg font-bold shrink-0", getAvatarGradient(selectedUserForSheet.name))}>
                      {(selectedUserForSheet.name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      <span className={cn(
                        "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background",
                        selectedUserForSheet.status === 'active' ? "bg-emerald-500" : selectedUserForSheet.status === 'pending' ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <SheetTitle className="text-xl font-bold truncate text-foreground">{selectedUserForSheet.name}</SheetTitle>
                        {isSelf && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-teal-500/30 text-teal-600 bg-teal-500/10 font-normal">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 shrink-0" />
                        {selectedUserForSheet.email}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={cn('gap-1 border font-medium text-xs', roleStyle.bg, roleStyle.text, roleStyle.border)}>
                          <RoleIcon className="h-3 w-3" />
                          {roleLabel(selectedUserForSheet.role)}
                        </Badge>
                        {selectedUserForSheet.status === 'pending' && (
                          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 text-[11px]">
                            Pending Approval
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <SheetDescription className="sr-only">
                    Profile and permission summary for {selectedUserForSheet.name}
                  </SheetDescription>
                </SheetHeader>

                {/* Contact & Organizational Info */}
                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact & Org Info</h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Email
                      </span>
                      <div className="flex items-center gap-1.5 font-medium truncate">
                        <span className="truncate">{selectedUserForSheet.email}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyEmail(e, selectedUserForSheet.email, selectedUserForSheet.id)}
                          className="text-muted-foreground hover:text-foreground shrink-0"
                        >
                          {copiedId === selectedUserForSheet.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Phone
                      </span>
                      <p className="font-medium">
                        {selectedUserForSheet.phone ? (
                          <a href={`tel:${selectedUserForSheet.phone}`} className="text-primary hover:underline">
                            {selectedUserForSheet.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Department
                      </span>
                      <p className="font-medium">{selectedUserForSheet.department || '—'}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Location
                      </span>
                      <p className="font-medium">{selectedUserForSheet.location?.name || '—'}</p>
                    </div>
                  </div>

                  {cat && (
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Support Domain:</span>
                      <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border font-medium text-[11px]", cat.className)}>
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Role & Permissions Info */}
                <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2 text-xs">
                  <h5 className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Role Authority & Permissions
                  </h5>
                  <p className="text-muted-foreground leading-relaxed">
                    {roleDescriptions[selectedUserForSheet.role]}
                  </p>
                </div>

                {/* Direct Management Actions */}
                <div className="space-y-3">
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Actions</h5>

                  {/* Super Admin Approval Controls */}
                  {selectedUserForSheet.status === 'pending' && isSuperAdmin && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        size="sm"
                        onClick={async () => {
                          await handleApproveUser(selectedUserForSheet.user_id.toString());
                          setSelectedUserForSheet(null);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1.5" /> Approve Account
                      </Button>
                      <Button
                        variant="outline"
                        className="border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-400 hover:bg-rose-500/10 font-medium"
                        size="sm"
                        onClick={async () => {
                          await handleRejectUser(selectedUserForSheet.user_id.toString());
                          setSelectedUserForSheet(null);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1.5" /> Reject
                      </Button>
                    </div>
                  )}

                  {selectedUserForSheet.status === 'pending' && !isSuperAdmin && (
                    <div className="p-3 rounded-xl border border-amber-300/80 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-amber-600 animate-pulse" />
                      <span>This account is pending approval by a Super Administrator.</span>
                    </div>
                  )}

                  {manageable ? (
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-xs h-9"
                        onClick={() => {
                          const u = selectedUserForSheet;
                          setSelectedUserForSheet(null);
                          handleEditUser(u);
                        }}
                      >
                        <Edit className="h-3.5 w-3.5 mr-2 text-primary" /> Edit User Profile
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-xs h-9 text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          const id = selectedUserForSheet.id;
                          setSelectedUserForSheet(null);
                          await handleDeleteUser(id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete User Account
                      </Button>
                    </div>
                  ) : selectedUserForSheet.role === 'requester' && isManager ? (
                    <div className="p-3 rounded-xl border border-border/80 bg-muted/40 text-muted-foreground text-xs flex items-start gap-2">
                      <Lock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">Requester Account Protected</p>
                        <p className="text-[11px] mt-0.5 text-muted-foreground">
                          Requesters are standard corporate staff. Their credentials and role assignments are protected to prevent unauthorized modifications.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Metadata footer */}
                <div className="pt-3 border-t border-border/60 text-[11px] text-muted-foreground/80 flex items-center justify-between">
                  <span>Member since {format(new Date(selectedUserForSheet.created_at), 'MMMM d, yyyy')}</span>
                  <span className="font-mono">ID: #{selectedUserForSheet.id.slice(0, 8)}</span>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {editingUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                disabled={!editingUser || !canManageUser(editingUser)}
              />
            </div>
            <ProfessionalEmailInput
              id="edit-email"
              label="Email"
              placeholder="user@company.com"
              value={editFormData.email}
              onChange={(email) => setEditFormData({ ...editFormData, email })}
              required
              disabled={!editingUser || !canManageUser(editingUser)}
            />
            <div>
              <Label>Role</Label>
              <Select
                value={editFormData.role}
                onValueChange={(val: AppRole) => setEditFormData({ ...editFormData, role: val })}
                disabled={!editingUser || !canManageUser(editingUser)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(editingUser && canManageUser(editingUser) ? assignableRoles : ALL_ASSIGNABLE_ROLES).map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingUser && !canManageUser(editingUser) && (
                <p className="text-xs text-muted-foreground mt-1">
                  Only super admins can change manager or super admin roles.
                </p>
              )}
            </div>
            <div>
              <Label>Department</Label>
              <Select
                value={editFormData.department || 'none'}
                onValueChange={(val: string) => setEditFormData({ ...editFormData, department: val === 'none' ? '' : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Support Category — only for manager/admin accounts */}
            {(editFormData.role === 'admin' || editingUser?.role === 'admin') && (
              <div>
                <Label>
                  Support Category
                  <span className="ml-1 text-xs text-amber-500 font-medium">(Determines ticket routing)</span>
                </Label>
                <Select
                  value={editFormData.support_category || 'none'}
                  onValueChange={(val) =>
                    setEditFormData({ ...editFormData, support_category: val === 'none' ? '' : val as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select support category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Not assigned —</SelectItem>
                    <SelectItem value="it_support">🖥️ IT Support</SelectItem>
                    <SelectItem value="sap">⚙️ System & ERP</SelectItem>
                    <SelectItem value="general">🏢 General / Facility</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Location</Label>
              <Select
                value={editFormData.location_id}
                onValueChange={(val: string) => setEditFormData({ ...editFormData, location_id: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {locations?.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Users;
