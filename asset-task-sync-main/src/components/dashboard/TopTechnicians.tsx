import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePerformanceReport } from '@/hooks/useReports';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Trophy } from 'lucide-react';

const TopTechnicians = () => {
    const { data, isLoading } = usePerformanceReport({});

    // Sort technicians by completed tasks descending and take top 5
    const topTechnicians = data?.technician_stats
        ?.sort((a: any, b: any) => Number(b.completed_count) - Number(a.completed_count))
        .slice(0, 5) || [];

    if (isLoading) {
        return (
            <Card className="col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Technicians</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Technicians</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4 mt-2">
                    {topTechnicians.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                    ) : (
                        topTechnicians.map((tech: any, index: number) => (
                            <div key={tech.assigned_technician_id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className={`text-xs font-medium ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-muted text-muted-foreground'
                                                }`}>
                                                {tech.assigned_technician?.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {index < 3 && (
                                            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-[8px] border border-white ${index === 0 ? 'bg-yellow-500 text-white' :
                                                index === 1 ? 'bg-gray-400 text-white' :
                                                    'bg-orange-400 text-white'
                                                }`}>
                                                {index + 1}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium leading-none">{tech.assigned_technician?.name}</span>
                                        <span className="text-xs text-muted-foreground mt-1">
                                            {tech.completed_count} tickets completed
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium">{Number(tech.avg_rating || 0).toFixed(1)}</span>
                                    <span className="text-xs text-yellow-500">★</span>
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
