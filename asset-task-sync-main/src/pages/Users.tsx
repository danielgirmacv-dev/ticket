import { useState } from 'react';
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
import { Plus, Search, UserPlus, Shield, Wrench, User as UserIcon, Mail, Building2, MapPin, MoreVertical, Edit, Trash2, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import laravelClient from '@/integrations/laravel/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api-error';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const roleStyles = {
  super_admin: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', icon: Shield },
  admin: { bg: 'bg-destructive/10', text: 'text-destructive', icon: Shield },
  technician: { bg: 'bg-info/10', text: 'text-info', icon: Wrench },
  requester: { bg: 'bg-success/10', text: 'text-success', icon: UserIcon },
};

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
const MANAGER_ASSIGNABLE_ROLES: AppRole[] = ['technician', 'requester'];

const Users = () => {
  const { role: currentRole } = useAuth();
  const isSuperAdmin = currentRole === 'super_admin';
  const assignableRoles = isSuperAdmin ? ALL_ASSIGNABLE_ROLES : MANAGER_ASSIGNABLE_ROLES;

  const canManageUser = (user: UserWithRole) =>
    isSuperAdmin || (user.role !== 'admin' && user.role !== 'super_admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: users, isLoading } = useUsers();
  const { data: locations } = useLocations();
  const { data: departments } = useDepartments();
  const createUser = useCreateUser();
  const updateUserRole = useUpdateUserRole();

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'requester' as AppRole,
    department: '',
    location_id: 'none',
    password: '',
  });

  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'requester' as AppRole,
    department: '',
    location_id: 'none',
  });

  const handleCreateUser = async () => {
    try {
      await createUser.mutateAsync({
        ...newUser,
        location_id: newUser.location_id === 'none' ? undefined : newUser.location_id,
      });
      setIsDialogOpen(false);
      setNewUser({
        name: '',
        email: '',
        role: 'requester',
        department: '',
        location_id: 'none',
        password: '',
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
      location_id: user.location_id || 'none',
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      // Update user role
      await handleRoleUpdate(editingUser.id, editFormData.role);

      // Update profile fields
      const profileUpdates: {
        name?: string;
        email?: string;
        department?: string;
        location_id?: string | null;
      } = {};
      if (editFormData.name !== editingUser.name) profileUpdates.name = editFormData.name;
      if (editFormData.email !== editingUser.email) profileUpdates.email = editFormData.email;
      if (editFormData.department !== (editingUser.department || '')) {
        profileUpdates.department = editFormData.department;
      }
      if (editFormData.location_id !== (editingUser.location_id || 'none')) {
        profileUpdates.location_id = editFormData.location_id === 'none' ? null : editFormData.location_id;
      }
      if (Object.keys(profileUpdates).length > 0) {
        await laravelClient.put(`/profiles/${editingUser.id}`, profileUpdates);
      }

      toast.success('User updated successfully');
      setEditingUser(null);
      window.location.reload();
    } catch (error) {
      toast.error('Failed to update user');
      console.error(error);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await laravelClient.post(`/users/${userId}/approve`);
      toast.success('User approved successfully');
      window.location.reload(); // Refresh users list
    } catch (error) {
      toast.error('Failed to approve user');
      console.error(error);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await laravelClient.post(`/users/${userId}/reject`);
      toast.success('User rejected');
      window.location.reload(); // Refresh users list
    } catch (error) {
      toast.error('Failed to reject user');
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
      window.location.reload(); // Refresh users list
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete user'));
      console.error(error);
    }
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || user.location_id === locationFilter;
    return matchesSearch && matchesRole && matchesStatus && matchesLocation;
  }) || [];

  const usersByRole = {
    super_admin: users?.filter(u => u.role === 'super_admin').length || 0,
    admin: users?.filter(u => u.role === 'admin').length || 0,
    technician: users?.filter(u => u.role === 'technician').length || 0,
    requester: users?.filter(u => u.role === 'requester').length || 0,
  };

  if (isLoading) {
    return (
      <DashboardLayout title="User Management" subtitle="Manage users and their roles">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="User Management"
      subtitle="Manage users and their roles"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(usersByRole).map(([role, count]) => {
          const style = roleStyles[role as AppRole];
          const Icon = style.icon;
          const isSelected = roleFilter === role;
          return (
            <Card 
              key={role} 
              className={cn(
                'relative overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50',
                isSelected ? 'ring-2 ring-primary border-transparent bg-muted/30' : 'hover:bg-muted/10'
              )}
              onClick={() => setRoleFilter(isSelected ? 'all' : role)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg transition-transform duration-200', style.bg, isSelected && 'scale-110')}>
                  <Icon className={cn('h-6 w-6', style.text)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{roleLabel(role as AppRole)}s</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Manager</SelectItem>
              <SelectItem value="technician">Technician</SelectItem>
              <SelectItem value="requester">Requester</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
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
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations?.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="accent">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with role assignment.
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
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g., john@company.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(val: AppRole) => setNewUser({ ...newUser, role: val })}
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
                <Button variant="accent" onClick={handleCreateUser} disabled={createUser.isPending}>
                  {createUser.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => {
                  const roleStyle = roleStyles[user.role];
                  const RoleIcon = roleStyle.icon;
                  return (
                    <tr
                      key={user.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-muted font-medium">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                      </td>
                      <td>
                        {canManageUser(user) ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Badge className={cn('gap-1.5 cursor-pointer hover:opacity-80', roleStyle.bg, roleStyle.text)}>
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
                          <Badge className={cn('gap-1.5', roleStyle.bg, roleStyle.text)}>
                            <RoleIcon className="h-3 w-3" />
                            <span className="capitalize">{roleLabel(user.role)}</span>
                          </Badge>
                        )}
                      </td>
                      <td>
                        {user.status === 'pending' && (
                          <Badge className="gap-1.5 bg-warning/10 text-warning">
                            <Clock className="h-3 w-3" />
                            <span>Pending</span>
                          </Badge>
                        )}
                        {user.status === 'active' && (
                          <Badge className="gap-1.5 bg-success/10 text-success">
                            <CheckCircle className="h-3 w-3" />
                            <span>Active</span>
                          </Badge>
                        )}
                        {user.status === 'rejected' && (
                          <Badge className="gap-1.5 bg-destructive/10 text-destructive">
                            <XCircle className="h-3 w-3" />
                            <span>Rejected</span>
                          </Badge>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          {user.department || '-'}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {user.location?.name || '-'}
                        </div>
                      </td>
                      <td className="text-muted-foreground">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="text-right">
                        {canManageUser(user) ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 px-2 py-1 rounded-md border border-dashed border-muted-foreground/20">
                            <Shield className="h-3 w-3" />
                            Protected
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <UserIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

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
                disabled
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                disabled
              />
            </div>
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
