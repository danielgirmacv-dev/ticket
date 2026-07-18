import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq } from '@/hooks/useFaqs';
import { Faq } from '@/integrations/laravel/client';
import { Loader2, Plus, Edit, Trash2, BookOpen, KeyRound, Cpu, Wifi, ShieldAlert, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; badge: string; icon: LucideIcon }> = {
  General: {
    bg: 'bg-emerald-50/30 dark:bg-emerald-950/5',
    border: 'border-emerald-200/60 dark:border-emerald-900/30 border-l-4 border-l-emerald-500',
    text: 'text-emerald-800 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    icon: BookOpen,
  },
  Account: {
    bg: 'bg-blue-50/30 dark:bg-blue-950/5',
    border: 'border-blue-200/60 dark:border-blue-900/30 border-l-4 border-l-blue-500',
    text: 'text-blue-800 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: KeyRound,
  },
  Hardware: {
    bg: 'bg-purple-50/30 dark:bg-purple-950/5',
    border: 'border-purple-200/60 dark:border-purple-900/30 border-l-4 border-l-purple-500',
    text: 'text-purple-800 dark:text-purple-300',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    icon: Cpu,
  },
  Network: {
    bg: 'bg-amber-50/30 dark:bg-amber-950/5',
    border: 'border-amber-200/60 dark:border-amber-900/30 border-l-4 border-l-amber-500',
    text: 'text-amber-800 dark:text-amber-300',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    icon: Wifi,
  },
  Access: {
    bg: 'bg-rose-50/30 dark:bg-rose-950/5',
    border: 'border-rose-200/60 dark:border-rose-900/30 border-l-4 border-l-rose-500',
    text: 'text-rose-800 dark:text-rose-300',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    icon: ShieldAlert,
  },
};

const getCategoryStyle = (category: string) => {
  return CATEGORY_STYLES[category] || {
    bg: 'bg-muted/30',
    border: 'border-muted border-l-4 border-l-muted-foreground',
    text: 'text-muted-foreground',
    badge: 'bg-muted text-muted-foreground',
    icon: BookOpen,
  };
};

const CATEGORIES = ['General', 'Account', 'Hardware', 'Network', 'Access'];

const emptyForm = {
  question: '',
  answer: '',
  category: 'General',
  is_published: true,
  sort_order: 0,
};

export default function Faqs() {
  const { data: faqs, isLoading } = useFaqs();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (faq: Faq) => {
    setEditing(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      is_published: faq.is_published,
      sort_order: faq.sort_order,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (editing) {
      await updateFaq.mutateAsync({ id: editing.id, ...form });
    } else {
      await createFaq.mutateAsync(form);
    }
    setIsDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    await deleteFaq.mutateAsync(id);
  };

  return (
    <DashboardLayout title="FAQ Management" subtitle="Create and publish help articles">
      <Card className="max-w-5xl mx-auto">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              FAQs
            </CardTitle>
            <CardDescription>
              Published articles appear in the Help Center for all users.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="accent" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
                <DialogDescription>
                  {editing ? 'Update this help article' : 'Create a new help article'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid gap-2">
                  <Label>Question</Label>
                  <Input
                    value={form.question}
                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                    placeholder="e.g., How do I reset my password?"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Answer</Label>
                  <Textarea
                    value={form.answer}
                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                    rows={6}
                    placeholder="Write a clear, step-by-step answer..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Sort order</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.sort_order}
                      onChange={(e) =>
                        setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label>Published</Label>
                    <p className="text-xs text-muted-foreground">Visible in Help Center</p>
                  </div>
                  <Switch
                    checked={form.is_published}
                    onCheckedChange={(c) => setForm({ ...form, is_published: c })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    !form.question.trim() ||
                    !form.answer.trim() ||
                    createFaq.isPending ||
                    updateFaq.isPending
                  }
                >
                  {(createFaq.isPending || updateFaq.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {editing ? 'Save changes' : 'Create FAQ'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !faqs?.length ? (
            <p className="text-center py-12 text-muted-foreground">
              No FAQs yet. Add your first article or run the database seeder.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {faqs.map((faq) => {
                const style = getCategoryStyle(faq.category);
                const Icon = style.icon;
                return (
                  <Card key={faq.id} className={cn("transition-all duration-200 hover:shadow-md", style.bg, style.border)}>
                    <CardContent className="p-5 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={cn("font-medium", style.badge)} variant="secondary">
                            <Icon className="h-3 w-3 mr-1 inline" />
                            {faq.category}
                          </Badge>
                          {!faq.is_published && (
                            <Badge variant="outline" className="border-dashed text-orange-500 border-orange-500 bg-orange-500/10">Draft</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">Order: {faq.sort_order}</span>
                        </div>
                        <h4 className="font-semibold text-base mb-2">{faq.question}</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="hover:bg-background/80" onClick={() => openEdit(faq)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(faq.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
