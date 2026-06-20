import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useLocations, useCreateLocation, useDeleteLocation, useUpdateLocation, useImportLocationsCsv } from '@/hooks/useLocations';
import { Loader2, Plus, Upload, Edit, Trash2, Users } from 'lucide-react';
import { useProfilesByLocation } from '@/hooks/useProfilesByLocation';
import { toast } from 'sonner';

const Locations = () => {
  const { data: locations, isLoading } = useLocations();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();
  const importCsv = useImportLocationsCsv();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', address: '', description: '' });
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isViewUsersOpen, setIsViewUsersOpen] = useState(false);

  const { data: profiles, isLoading: isProfilesLoading } = useProfilesByLocation(selectedLocation?.id);

  const handleSave = async () => {
    try {
      if (editing) {
        await updateLocation.mutateAsync({ id: editing.id, ...form });
        setEditing(null);
      } else {
        await createLocation.mutateAsync(form);
      }
      setIsDialogOpen(false);
      setForm({ name: '', address: '', description: '' });
    } catch (e) {
      // handled by hooks
    }
  };

  const handleEdit = (loc: any) => {
    setEditing(loc);
    setForm({ name: loc.name, address: loc.address || '', description: loc.description || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this location?')) return;
    await deleteLocation.mutateAsync(id);
  };

  const handleImportFile = async (file?: File) => {
    if (!file) return;
    try {
      await importCsv.mutateAsync(file);
    } catch (e: any) {
      // handled by hook
    }
  };

  return (
    <DashboardLayout title="Locations" subtitle="Manage asset locations">
      <Card className="max-w-5xl mx-auto">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Locations</CardTitle>
            <CardDescription>Manage physical locations for assets.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <label>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleImportFile(e.target.files?.[0])}
              />
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
            </label>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="accent" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Location
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Location' : 'Add Location'}</DialogTitle>
                  <DialogDescription>{editing ? 'Update location details' : 'Create a new location'}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={createLocation.isPending || updateLocation.isPending}>
                    {createLocation.isPending || updateLocation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editing ? 'Update' : 'Create')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Description</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations?.map((loc: any) => (
                    <tr key={loc.id}>
                      <td>{loc.name}</td>
                      <td className="text-muted-foreground">{loc.address || '-'}</td>
                      <td className="text-muted-foreground">{loc.description || '-'}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(loc)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedLocation(loc); setIsViewUsersOpen(true); }}>
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(loc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewUsersOpen} onOpenChange={setIsViewUsersOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Users at {selectedLocation?.name}</DialogTitle>
            <DialogDescription>Profiles assigned to this location</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            {isProfilesLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <div>
                {profiles?.length ? (
                  <ul className="list-disc pl-6">
                    {profiles.map((p: any) => (
                      <li key={p.id} className="py-1">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-muted-foreground">{p.email} {p.user?.roles?.length ? ` — ${p.user.roles.map((r:any)=>r.name).join(', ')}`: ''}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-muted-foreground">No users assigned to this location.</div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewUsersOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Locations;
