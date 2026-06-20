import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment, useImportDepartmentsCsv } from '@/hooks/useDepartments';
import { Loader2, Plus, Upload, Edit, Trash2 } from 'lucide-react';

const Departments = () => {
  const { data: departments, isLoading } = useDepartments();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();
  const importCsv = useImportDepartmentsCsv();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const handleSave = async () => {
    try {
      if (editing) {
        await updateDepartment.mutateAsync({ id: editing.id, ...form });
        setEditing(null);
      } else {
        await createDepartment.mutateAsync(form);
      }
      setIsDialogOpen(false);
      setForm({ name: '', description: '' });
    } catch (e) {
      // handled by hooks
    }
  };

  const handleEdit = (d: any) => {
    setEditing(d);
    setForm({ name: d.name, description: d.description || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department?')) return;
    await deleteDepartment.mutateAsync(id);
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
    <DashboardLayout title="Departments" subtitle="Manage company departments">
      <Card className="max-w-5xl mx-auto">
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Departments</CardTitle>
            <CardDescription>Manage departments for user profiles and reporting.</CardDescription>
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
                  Add Department
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Department' : 'Add Department'}</DialogTitle>
                  <DialogDescription>{editing ? 'Update department details' : 'Create a new department'}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={createDepartment.isPending || updateDepartment.isPending}>
                    {createDepartment.isPending || updateDepartment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editing ? 'Update' : 'Create')}
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
                    <th>Description</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments?.map((d: any) => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td className="text-muted-foreground">{d.description || '-'}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}>
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
    </DashboardLayout>
  );
};

export default Departments;
