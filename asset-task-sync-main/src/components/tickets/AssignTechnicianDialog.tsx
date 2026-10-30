import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAssignTicket } from '@/hooks/useTicketWorkflow';
import { MaintenanceTicket } from '@/integrations/laravel/client';
import { Check, Search, Wrench, UserCheck, UserX, Building2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AssignableTechnician {
    id: string;
    name: string;
    email?: string;
    department?: string | null;
    phone?: string;
    active_assigned_tickets_count?: number;
}

interface AssignTechnicianDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket: MaintenanceTicket | null;
    technicians: AssignableTechnician[];
    onSuccess?: () => void;
}

function getAvatarGradient(name: string) {
    const gradients = [
        'from-teal-500 to-emerald-600 text-white',
        'from-blue-500 to-indigo-600 text-white',
        'from-violet-500 to-purple-600 text-white',
        'from-amber-500 to-orange-600 text-white',
        'from-cyan-500 to-blue-600 text-white',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
}

export function AssignTechnicianDialog({
    open,
    onOpenChange,
    ticket,
    technicians,
    onSuccess
}: AssignTechnicianDialogProps) {
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusTab, setStatusTab] = useState<'all' | 'available' | 'assigned'>('all');
    const assignTicket = useAssignTicket();

    // Reset selection and filters when dialog opens
    useEffect(() => {
        if (open) {
            setSelectedTechnician(ticket?.assigned_technician_id || '');
            setSearchQuery('');
            setStatusTab('all');
        }
    }, [open, ticket?.assigned_technician_id]);

    const counts = useMemo(() => {
        const available = technicians.filter(t => (t.active_assigned_tickets_count ?? 0) === 0).length;
        const assigned = technicians.filter(t => (t.active_assigned_tickets_count ?? 0) > 0).length;
        return {
            all: technicians.length,
            available,
            assigned,
        };
    }, [technicians]);

    const filteredTechnicians = useMemo(() => {
        return technicians.filter(tech => {
            const activeCount = tech.active_assigned_tickets_count ?? 0;
            if (statusTab === 'available' && activeCount > 0) return false;
            if (statusTab === 'assigned' && activeCount === 0) return false;

            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchesName = (tech.name || '').toLowerCase().includes(query);
                const matchesEmail = (tech.email || '').toLowerCase().includes(query);
                const matchesDept = (tech.department || '').toLowerCase().includes(query);
                return matchesName || matchesEmail || matchesDept;
            }
            return true;
        }).sort((a, b) => {
            // Put available (0 active tickets) first, then least loaded
            const countA = a.active_assigned_tickets_count ?? 0;
            const countB = b.active_assigned_tickets_count ?? 0;
            if (countA !== countB) return countA - countB;
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [technicians, statusTab, searchQuery]);

    const selectedTechObj = technicians.find(t => t.id === selectedTechnician);

    const handleAssign = () => {
        if (!selectedTechnician || !ticket) return;

        assignTicket.mutate(
            { id: ticket.id, assigned_technician_id: selectedTechnician },
            {
                onSuccess: () => {
                    onOpenChange(false);
                    if (onSuccess) onSuccess();
                }
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-lg p-0 overflow-hidden gap-0">
                <DialogHeader className="p-5 pb-4 border-b border-border/70 bg-muted/20">
                    <div className="flex items-center gap-2 text-primary font-medium text-xs uppercase tracking-wider mb-1">
                        <Wrench className="h-3.5 w-3.5" />
                        Technician Dispatch
                    </div>
                    <DialogTitle className="text-lg">Assign Technician</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground truncate max-w-full">
                        Ticket: <span className="font-semibold text-foreground">{ticket?.title}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="p-5 space-y-3.5">
                    {/* Quick Filter Tabs: All, Available / Not Assigned, Assigned */}
                    <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-lg border border-border/60">
                        <button
                            type="button"
                            onClick={() => setStatusTab('all')}
                            className={cn(
                                "flex-1 text-xs py-1.5 px-2 rounded-md font-medium transition-all text-center",
                                statusTab === 'all'
                                    ? "bg-background text-foreground shadow-2xs font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            All ({counts.all})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusTab('available')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-md font-medium transition-all text-center",
                                statusTab === 'available'
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold shadow-2xs border border-emerald-500/30"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Available ({counts.available})
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatusTab('assigned')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-2 rounded-md font-medium transition-all text-center",
                                statusTab === 'assigned'
                                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold shadow-2xs border border-amber-500/30"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            Assigned ({counts.assigned})
                        </button>
                    </div>

                    {/* Search Field */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search technician by name, department, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs bg-card"
                        />
                    </div>

                    {/* Technicians List */}
                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        {filteredTechnicians.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">
                                <UserX className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                                No technicians found matching this criteria.
                            </div>
                        ) : (
                            filteredTechnicians.map((tech) => {
                                const activeCount = tech.active_assigned_tickets_count ?? 0;
                                const isAvailable = activeCount === 0;
                                const isSelected = selectedTechnician === tech.id;
                                const initials = (tech.name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                                return (
                                    <div
                                        key={tech.id}
                                        onClick={() => setSelectedTechnician(tech.id)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-150 select-none",
                                            isSelected
                                                ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-2xs ring-1 ring-primary/80"
                                                : "border-border/70 hover:border-primary/40 hover:bg-muted/30"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br font-bold text-xs shadow-2xs", getAvatarGradient(tech.name))}>
                                                    {initials}
                                                </div>
                                                <span
                                                    className={cn(
                                                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                                                        isAvailable ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                                                    )}
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                                                        {tech.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                                                    {tech.department ? (
                                                        <span className="flex items-center gap-1 truncate">
                                                            <Building2 className="h-2.5 w-2.5 shrink-0" />
                                                            {tech.department}
                                                        </span>
                                                    ) : tech.email ? (
                                                        <span className="truncate">{tech.email}</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {isAvailable ? (
                                                <Badge
                                                    variant="outline"
                                                    className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium text-[10px] sm:text-[11px]"
                                                >
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    Available (Not Assigned)
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="gap-1 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-medium text-[10px] sm:text-[11px]"
                                                >
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                    Assigned ({activeCount} active)
                                                </Badge>
                                            )}

                                            <div className={cn(
                                                "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                                                isSelected
                                                    ? "bg-primary border-primary text-primary-foreground shadow-2xs"
                                                    : "border-muted-foreground/30 text-transparent"
                                            )}>
                                                <Check className="h-3 w-3 stroke-[3]" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {selectedTechObj && (
                        <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs flex items-center justify-between">
                            <span className="text-muted-foreground">Selected technician:</span>
                            <span className="font-semibold text-primary flex items-center gap-1">
                                <UserCheck className="h-3.5 w-3.5" />
                                {selectedTechObj.name}
                                <span className="text-muted-foreground font-normal">
                                    ({(selectedTechObj.active_assigned_tickets_count ?? 0) === 0 ? 'Available / Free' : `${selectedTechObj.active_assigned_tickets_count} active tickets`})
                                </span>
                            </span>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 border-t border-border/70 bg-muted/20 flex-col-reverse sm:flex-row gap-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleAssign}
                        disabled={!selectedTechnician || assignTicket.isPending}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {assignTicket.isPending ? 'Assigning...' : 'Confirm Assignment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

