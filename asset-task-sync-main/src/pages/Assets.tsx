import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset, useImportAssetsCsv } from '@/hooks/useAssets';
import { useUsers } from '@/hooks/useUsers';
import { Asset } from '@/integrations/laravel/client';
import { Plus, Search, Filter, Monitor, Printer, Server, Network, MoreVertical, Edit, Trash2, Loader2, Upload, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const assetTypeIcons = {
  computer: Monitor,
  printer: Printer,
  server: Server,
  network_device: Network,
  other: Monitor,
};

const statusStyles = {
  active: 'bg-success/10 text-success border-success/20',
  maintenance: 'bg-warning/10 text-warning border-warning/20',
  retired: 'bg-muted text-muted-foreground border-muted',
  disposed: 'bg-destructive/10 text-destructive border-destructive/20',
};

const Assets = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    name: '',
    type: 'computer',
    serial_number: '',
    location: '',
    status: 'active',
  });

  const { data: assets, isLoading } = useAssets();
  const { data: users } = useUsers();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const importCsv = useImportAssetsCsv();

  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('none');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  const handleCreateAsset = async () => {
    await createAsset.mutateAsync(newAsset);
    setIsDialogOpen(false);
    setNewAsset({
      name: '',
      type: 'computer',
      serial_number: '',
      location: '',
      status: 'active',
    });
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setNewStatus(asset.status);
    setAssignedTo(asset.assigned_to || 'none');
  };

  const handleUpdateAsset = async () => {
    if (!editingAsset) return;
    await updateAsset.mutateAsync({
      id: editingAsset.id,
      status: newStatus as Asset['status'],
      assigned_to: assignedTo === 'none' ? null : assignedTo,
    });
    setEditingAsset(null);
  };

  const handleDeleteAsset = async (id: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      await deleteAsset.mutateAsync(id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleImportCsv = async () => {
    if (!selectedFile) return;

    try {
      const result = await importCsv.mutateAsync(selectedFile);
      setImportResult(result);
      setSelectedFile(null);

      // Close dialog after 3 seconds if successful
      if (result.error_count === 0) {
        setTimeout(() => {
          setIsImportDialogOpen(false);
          setImportResult(null);
        }, 3000);
      }
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/assets-template.csv';
    link.download = 'assets-template.csv';
    link.click();
  };

  const filteredAssets = assets?.filter(asset => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <DashboardLayout title="Asset Management" subtitle="Manage and track all IT assets">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Asset Management"
      subtitle="Manage and track all IT assets"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assets by name, serial number, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="computer">Computers</SelectItem>
              <SelectItem value="printer">Printers</SelectItem>
              <SelectItem value="server">Servers</SelectItem>
              <SelectItem value="network_device">Network</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Import Assets from CSV</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to bulk import assets. Download the template to see the required format.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Button variant="outline" onClick={downloadTemplate} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
                <div className="grid gap-2">
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
                {importResult && (
                  <div className={cn(
                    "p-4 rounded-lg border",
                    importResult.error_count > 0 ? "bg-warning/10 border-warning" : "bg-success/10 border-success"
                  )}>
                    <p className="font-medium mb-2">{importResult.message}</p>
                    <div className="text-sm space-y-1">
                      <p>✓ Successfully imported: {importResult.success_count}</p>
                      {importResult.error_count > 0 && (
                        <p>✗ Failed: {importResult.error_count}</p>
                      )}
                    </div>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium">View Errors</summary>
                        <div className="mt-2 text-xs space-y-1 max-h-40 overflow-y-auto">
                          {importResult.errors.slice(0, 5).map((err: any, idx: number) => (
                            <div key={idx} className="p-2 bg-background rounded">
                              <p>Row {err.row}: {Object.values(err.errors).flat().join(', ')}</p>
                            </div>
                          ))}
                          {importResult.errors.length > 5 && (
                            <p className="text-muted-foreground">... and {importResult.errors.length - 5} more errors</p>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsImportDialogOpen(false);
                  setSelectedFile(null);
                  setImportResult(null);
                }}>
                  Close
                </Button>
                <Button
                  onClick={handleImportCsv}
                  disabled={!selectedFile || importCsv.isPending}
                >
                  {importCsv.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="accent">
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
                <DialogDescription>
                  Enter the details of the new IT asset.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Asset Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Dell OptiPlex 7090"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newAsset.type}
                      onValueChange={(val: any) => setNewAsset({ ...newAsset, type: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="computer">Computer</SelectItem>
                        <SelectItem value="printer">Printer</SelectItem>
                        <SelectItem value="server">Server</SelectItem>
                        <SelectItem value="network_device">Network Device</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="serial">Serial Number</Label>
                    <Input
                      id="serial"
                      placeholder="e.g., DL-2024-001"
                      value={newAsset.serial_number}
                      onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Building A - Floor 2"
                    value={newAsset.location}
                    onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={newAsset.status}
                    onValueChange={(val: any) => setNewAsset({ ...newAsset, status: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="disposed">Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Assigned To (optional)</Label>
                  <Select
                    value={newAsset.assigned_to || 'none'}
                    onValueChange={(val) =>
                      setNewAsset({
                        ...newAsset,
                        assigned_to: val === 'none' ? undefined : val,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {users?.filter((u) => u.status === 'active').map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="purchase">Purchase Date</Label>
                    <Input
                      id="purchase"
                      type="date"
                      onChange={(e) => setNewAsset({ ...newAsset, purchase_date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="warranty">Warranty Expiry</Label>
                    <Input
                      id="warranty"
                      type="date"
                      onChange={(e) => setNewAsset({ ...newAsset, warranty_expiry: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="accent" onClick={handleCreateAsset} disabled={createAsset.isPending}>
                  {createAsset.isPending ? 'Adding...' : 'Add Asset'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset, index) => {
          const Icon = assetTypeIcons[asset.type] || Monitor;
          return (
            <Card
              key={asset.id}
              className="group hover:shadow-lg transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold group-hover:text-accent transition-colors">
                        {asset.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {asset.serial_number}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Asset
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteAsset(asset.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'status-badge border',
                    statusStyles[asset.status]
                  )}>
                    {asset.status}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {asset.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-right">{asset.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Date</span>
                    <span>{asset.purchase_date ? format(new Date(asset.purchase_date), 'MMM d, yyyy') : 'N/A'}</span>
                  </div>
                  {asset.warranty_expiry && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Warranty Until</span>
                      <span className={cn(
                        new Date(asset.warranty_expiry) < new Date() && 'text-destructive'
                      )}>
                        {format(new Date(asset.warranty_expiry), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned To</span>
                    <span className="font-medium">
                      {asset.assigned_user?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAssets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Monitor className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No assets found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Edit Asset Dialog */}
      <Dialog open={!!editingAsset} onOpenChange={() => setEditingAsset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update status or assign a user to {editingAsset?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assigned To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users?.filter((u) => u.status === 'active').map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAsset(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAsset} disabled={updateAsset.isPending}>
              {updateAsset.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout >
  );
};

export default Assets;
