import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFaqs } from '@/hooks/useFaqs';
import { useAuth } from '@/hooks/useAuth';
import { Faq } from '@/integrations/laravel/client';
import { HelpCircle, Loader2, Search, ArrowRight, KeyRound, Cpu, Wifi, ShieldAlert, BookOpen, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const FAQ_CATEGORIES = ['all', 'General', 'Account', 'Hardware', 'Network', 'Access'];

export default function Help() {
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const { data: faqs, isLoading } = useFaqs({
    search: search || undefined,
    category: category !== 'all' ? category : undefined,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Faq[]>();
    (faqs || []).forEach((faq) => {
      const list = map.get(faq.category) || [];
      list.push(faq);
      map.set(faq.category, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [faqs]);

  const isAdmin = role === 'admin' || role === 'super_admin';

  return (
    <DashboardLayout title="Help Center" subtitle="Find answers before submitting a request">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Search common IT questions. If you still need help, submit a new request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {FAQ_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isAdmin && (
              <div className="rounded-lg border bg-muted/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm text-muted-foreground">Manage FAQ content for your organization.</p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/faqs">Manage FAQs</Link>
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !faqs?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No articles found.</p>
                <Button variant="link" asChild className="mt-2">
                  <Link to="/requests">Submit a request instead</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map(([cat, items]) => {
                  const style = getCategoryStyle(cat);
                  const Icon = style.icon;
                  return (
                    <Card key={cat} className={cn("overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md", style.bg, style.border)}>
                      <CardHeader className="py-4 px-5 border-b border-muted/20 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn("p-1.5 rounded-md", style.badge)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="font-bold text-sm tracking-wide uppercase text-foreground/80">{cat}</span>
                        </div>
                        <Badge variant="outline" className="bg-background/60 font-normal border-muted-foreground/20 text-muted-foreground">
                          {items.length} {items.length === 1 ? 'Article' : 'Articles'}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Accordion type="single" collapsible className="w-full">
                          {items!.map((faq, index) => (
                            <AccordionItem 
                              key={faq.id} 
                              value={faq.id}
                              className={cn(
                                "px-5 border-b border-muted/10 last:border-0",
                                index % 2 === 0 ? "bg-background/25" : "bg-transparent"
                              )}
                            >
                              <AccordionTrigger className="text-left text-sm font-semibold hover:text-primary transition-colors py-3.5">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-sm text-muted-foreground/85 whitespace-pre-wrap leading-relaxed pb-4">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="pt-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Didn&apos;t find what you need?</p>
              <Button variant="accent" asChild>
                <Link to="/requests">
                  Submit a request
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
