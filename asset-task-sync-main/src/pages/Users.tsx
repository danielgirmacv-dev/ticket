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
import { Plus, Search, UserPlus, Shield, Wrench, User as UserIcon, Mail, Building2, MoreVertical, Edit, Trash2, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import laravelClient from '@/integrations/laravel/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const roleStyles = {
  admin: { bg: 'bg-destructive/10', text: 'text-destructive', icon: Shield },
  technician: { bg: 'bg-info/10', text: 'text-info', icon: Wrench },
  requester: { bg: 'bg-success/10', text: 'text-success', icon: UserIcon },
};

const Users = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUserRole = useUpdateUserRole();

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'requester' as AppRole,
    department: '',
    password: '',
  });

  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'requester' as AppRole,
    department: '',
  });

  const handleCreateUser = async () => {
    try {
      await createUser.mutateAsync(newUser);
      setIsDialogOpen(false);
      setNewUser({
        name: '',
        email: '',
        role: 'requester',
        department: '',
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
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      // Update user role
      await handleRoleUpdate(editingUser.id, editFormData.role);

      // Update profile fields
      const profileUpdates: Record<string, string> = {};
      if (editFormData.name !== editingUser.name) profileUpdates.name = editFormData.name;
      if (editFormData.email !== editingUser.email) profileUpdates.email = editFormData.email;
      if (editFormData.department !== (editingUser.department || '')) {
        profileUpdates.department = editFormData.department;
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
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      toast.error(errorMessage);
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
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const usersByRole = {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Object.entries(usersByRole).map(([role, count]) => {
          const style = roleStyles[role as AppRole];
          const Icon = style.icon;
          return (
            <Card key={role} className="relative overflow-hidden">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', style.bg)}>
                  <Icon className={cn('h-6 w-6', style.text)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground capitalize">{role}s</p>
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
              <SelectItem value="admin">Admin</SelectItem>
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
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="technician">Technician</SelectItem>
                        <SelectItem value="requester">Requester</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      placeholder="e.g., IT Support"
                      value={newUser.department}
                      onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    />
                  </div>
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Badge className={cn('gap-1.5 cursor-pointer hover:opacity-80', roleStyle.bg, roleStyle.text)}>
                              <RoleIcon className="h-3 w-3" />
                              <span className="capitalize">{user.role}</span>
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, 'admin')}>
                              Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, 'technician')}>
                              Technician
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, 'requester')}>
                              Requester
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                      <td className="text-muted-foreground">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="text-right">
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
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="requester">Requester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Department</Label>
              <Input
                value={editFormData.department}
                onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                placeholder="e.g., IT Department"
              />
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
