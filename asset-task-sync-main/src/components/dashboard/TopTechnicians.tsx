import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePerformanceReport } from '@/hooks/useReports';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const TopTechnicians = () => {
    const { data, isLoading } = usePerformanceReport({});

    // Sort technicians by completed tasks descending and take top 5
    const topTechnicians = [...(data?.technician_stats || [])]
        .sort((a, b) => Number(b.completed_count) - Number(a.completed_count))
        .slice(0, 5) || [];

    if (isLoading) {
        return (
            <Card className="col-span-1 border border-border/80 shadow-sm">
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1.5 flex-1">
                                <Skeleton className="h-3.5 w-28" />
                                <Skeleton className="h-2.5 w-20" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1 border border-border/80 shadow-xs border-t-2 border-t-amber-500 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3.5 bg-muted/20 border-b border-border/40">
                <div>
                    <CardTitle className="text-[18px] font-bold tracking-tight text-foreground flex items-center gap-2">
                        Top Technicians
                    </CardTitle>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Performance leaders</p>
                </div>
                <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <Trophy className="h-4 w-4 shrink-0" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 mt-1">
                    {topTechnicians.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                    ) : (
                        topTechnicians.map((tech, index) => (
                            <div key={tech.assigned_technician_id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className={`text-xs font-semibold ${index === 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                                                index === 1 ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' :
                                                    index === 2 ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300' :
                                                        'bg-muted text-muted-foreground'
                                                }`}>
                                                {tech.assigned_technician?.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {index < 3 && (
                                            <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold border border-background ${index === 0 ? 'bg-amber-500 text-white' :
                                                index === 1 ? 'bg-slate-400 text-white' :
                                                    'bg-orange-500 text-white'
                                                }`}>
                                                {index + 1}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[15px] font-medium leading-tight text-foreground">{tech.assigned_technician?.name}</span>
                                        <span className="text-[13px] text-muted-foreground mt-0.5">
                                            {tech.completed_count} tickets completed
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[14px] font-semibold text-foreground">{Number(tech.avg_rating || 0).toFixed(1)}</span>
                                    <span className="text-xs text-amber-500">★</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default TopTechnicians;
