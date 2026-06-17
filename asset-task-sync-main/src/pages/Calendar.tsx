import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTickets } from '@/hooks/useTickets';
import { ChevronLeft, ChevronRight, Clock, User, Loader2 } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { cn } from '@/lib/utils';

const priorityColors = {
  low: 'bg-muted',
  medium: 'bg-warning',
  high: 'bg-destructive/70',
  critical: 'bg-destructive',
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: tickets, isLoading } = useTickets();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getTicketsForDate = (date: Date) => {
    if (!tickets) return [];
    return tickets.filter(ticket =>
      isSameDay(new Date(ticket.scheduled_date), date)
    );
  };

  const selectedDateTickets = selectedDate ? getTicketsForDate(selectedDate) : [];

  if (isLoading) {
    return (
      <DashboardLayout title="Calendar" subtitle="View scheduled maintenance tickets">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Calendar"
      subtitle="View scheduled maintenance tickets"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week days header */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const dayTickets = getTicketsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isDayToday = isToday(day);

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'min-h-[100px] p-2 rounded-lg border border-transparent transition-all duration-200 text-left',
                      !isCurrentMonth && 'opacity-40',
                      isSelected && 'border-accent bg-accent/5',
                      isDayToday && !isSelected && 'bg-muted',
                      'hover:bg-muted/50'
                    )}
                  >
                    <span className={cn(
                      'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm',
                      isDayToday && 'bg-accent text-accent-foreground font-semibold'
                    )}>
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayTickets.slice(0, 3).map(ticket => (
                        <div
                          key={ticket.id}
                          className={cn(
                            'h-1.5 rounded-full',
                            priorityColors[ticket.priority]
                          )}
                          title={ticket.title}
                        />
                      ))}
                      {dayTickets.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{dayTickets.length - 3} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">
              {selectedDate
                ? format(selectedDate, 'EEEE, MMMM d')
                : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              selectedDateTickets.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-lg border border-border bg-muted/30 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge className={cn(
                            'text-xs mb-1',
                            ticket.priority === 'critical' ? 'bg-destructive' :
                              ticket.priority === 'high' ? 'priority-high' :
                                ticket.priority === 'medium' ? 'priority-medium' : 'priority-low'
                          )}>
                            {ticket.priority}
                          </Badge>
                          <h4 className="font-medium text-sm">{ticket.title}</h4>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
                        {ticket.estimated_duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{Math.floor(ticket.estimated_duration / 60)}h {ticket.estimated_duration % 60}m</span>
                          </div>
                        )}
                        {ticket.assigned_technician && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{ticket.assigned_technician.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    No tickets scheduled for this date
                  </p>
                </div>
              )
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Click on a date to view scheduled tickets
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card className="mt-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-medium text-muted-foreground">Priority Legend:</span>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              <span className="text-sm">Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive/70" />
              <span className="text-sm">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-warning" />
              <span className="text-sm">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-muted" />
              <span className="text-sm">Low</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Calendar;
