import { useState, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, Maximize2, Printer, Trash2, CalendarRange, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { SelectedSession, DateRange } from "@shared/schema";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  differenceInMonths,
  areIntervalsOverlapping
} from "date-fns";

interface SessionCalendarProps {
  selectedSessions: SelectedSession[];
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onRemoveSession: (sessionId: string) => void;
}

function detectOverlaps(sessions: SelectedSession[]): { session1: SelectedSession; session2: SelectedSession }[] {
  const overlaps: { session1: SelectedSession; session2: SelectedSession }[] = [];
  
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const s1 = sessions[i];
      const s2 = sessions[j];
      
      try {
        const interval1 = { start: parseISO(s1.startDate), end: parseISO(s1.endDate) };
        const interval2 = { start: parseISO(s2.startDate), end: parseISO(s2.endDate) };
        
        if (areIntervalsOverlapping(interval1, interval2, { inclusive: true })) {
          overlaps.push({ session1: s1, session2: s2 });
        }
      } catch (e) {
        // Skip invalid dates
      }
    }
  }
  
  return overlaps;
}

function CalendarGrid({
  currentMonth,
  selectedSessions,
  compact = false,
  onDayClick
}: {
  currentMonth: Date;
  selectedSessions: SelectedSession[];
  compact?: boolean;
  onDayClick?: (day: Date, sessions: SelectedSession[]) => void;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getSessionsForDay = (day: Date) => {
    return selectedSessions.filter((session) => {
      const start = parseISO(session.startDate);
      const end = parseISO(session.endDate);
      return isWithinInterval(day, { start, end });
    });
  };

  return (
    <div className={compact ? "text-xs" : ""}>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
        {weekDays.map((day) => (
          <div 
            key={day} 
            className={`text-center font-medium text-muted-foreground ${compact ? "py-0.5 text-[10px]" : "py-1 sm:py-2 text-xs sm:text-sm"}`}
          >
            {compact ? day[0] : day.slice(0, 3)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((day, idx) => {
          const daySessions = getSessionsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const hasMultiple = daySessions.length > 1;
          
          return (
            <div
              key={idx}
              onClick={() => onDayClick?.(day, daySessions)}
              className={`
                relative p-0.5 sm:p-1 rounded-md border border-transparent
                ${compact ? "min-h-[32px] sm:min-h-[40px]" : "min-h-[50px] sm:min-h-[80px]"}
                ${!isCurrentMonth ? "opacity-30" : ""}
                ${isToday ? "border-eggplant bg-eggplant/5" : ""}
                ${hasMultiple ? "ring-2 ring-gold/50" : ""}
                ${onDayClick ? "cursor-pointer hover:bg-muted/50" : ""}
              `}
            >
              <span className={`${compact ? "text-[10px]" : "text-xs sm:text-sm"} ${isToday ? "font-bold text-eggplant" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </span>
              {daySessions.length > 0 && (
                <div className={`mt-0.5 space-y-0.5 ${compact ? "" : "sm:space-y-1"}`}>
                  {daySessions.slice(0, compact ? 1 : 2).map((session) => (
                    <div
                      key={session.sessionId}
                      className={`${compact ? "h-1 sm:h-1.5" : "h-1.5 sm:h-auto sm:px-1 sm:py-0.5"} rounded text-[8px] sm:text-[10px] truncate`}
                      style={{ backgroundColor: session.color || "#5B2C6F" }}
                      title={`${session.campName}: ${session.sessionName}`}
                    >
                      {!compact && (
                        <span className="text-white font-medium hidden sm:inline">
                          {session.sessionName}
                        </span>
                      )}
                    </div>
                  ))}
                  {daySessions.length > (compact ? 1 : 2) && (
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground">
                      +{daySessions.length - (compact ? 1 : 2)}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyCalendarView({
  sessions,
  months,
  onRemove,
  overlaps
}: {
  sessions: SelectedSession[];
  months: Date[];
  onRemove: (sessionId: string) => void;
  overlaps: { session1: SelectedSession; session2: SelectedSession }[];
}) {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const getSessionsForDay = (day: Date) => {
    return sessions.filter((session) => {
      const start = parseISO(session.startDate);
      const end = parseISO(session.endDate);
      return isWithinInterval(day, { start, end });
    });
  };

  const isOverlappingSession = (sessionId: string) => {
    return overlaps.some(o => o.session1.sessionId === sessionId || o.session2.sessionId === sessionId);
  };

  return (
    <div className="space-y-6">
      {months.map((month, monthIdx) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const calendarStart = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(monthEnd);
        const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
        
        return (
          <div key={monthIdx} className="border rounded-lg overflow-hidden">
            <div className="bg-eggplant/10 px-4 py-2">
              <h3 className="font-semibold text-eggplant">{format(month, "MMMM yyyy")}</h3>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                  const daySessions = getSessionsForDay(day);
                  const isCurrentMonth = isSameMonth(day, month);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div
                      key={idx}
                      className={`
                        min-h-[80px] p-1 rounded border
                        ${!isCurrentMonth ? "bg-muted/30 opacity-50" : "bg-white"}
                        ${isToday ? "border-eggplant border-2" : "border-border/30"}
                      `}
                    >
                      <div className={`text-xs mb-1 ${isToday ? "font-bold text-eggplant" : "text-muted-foreground"}`}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {daySessions.map((session) => {
                          const hasOverlap = isOverlappingSession(session.sessionId);
                          return (
                            <div
                              key={session.sessionId}
                              className={`
                                group relative p-1.5 rounded text-[10px] text-white cursor-pointer
                                ${hasOverlap ? "ring-2 ring-gold ring-offset-1" : ""}
                              `}
                              style={{ backgroundColor: session.color || "#5B2C6F" }}
                            >
                              <div className="font-medium truncate pr-4">{session.campName}</div>
                              <div className="truncate opacity-80">{session.sessionName}</div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemove(session.sessionId);
                                }}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded bg-black/20 hover:bg-black/40 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
      
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-3">Session Details</h4>
        <div className="space-y-2">
          {sessions.map((session) => {
            const hasOverlap = isOverlappingSession(session.sessionId);
            return (
              <div 
                key={session.sessionId}
                className={`flex items-start gap-3 p-3 rounded-lg border ${hasOverlap ? "border-gold bg-gold/5" : ""}`}
                style={{ borderLeftWidth: 4, borderLeftColor: session.color || "#5B2C6F" }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{session.campName}</p>
                    {hasOverlap && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gold/20 text-gold-dark rounded-full">
                        Conflict
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{session.sessionName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(parseISO(session.startDate), "MMM d")} - {format(parseISO(session.endDate), "MMM d, yyyy")}
                  </p>
                  {session.price !== null && session.price !== undefined && (
                    <p className="text-sm font-medium text-eggplant mt-1">${session.price}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive"
                  onClick={() => onRemove(session.sessionId)}
                  data-testid={`button-remove-expanded-${session.sessionId}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PrintableCalendar({ 
  selectedSessions,
  months 
}: { 
  selectedSessions: SelectedSession[];
  months: Date[];
}) {
  return (
    <div className="p-4 sm:p-8 print:p-4" id="printable-calendar">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-eggplant mb-2">Summer Camp Schedule</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {format(months[0], "MMMM yyyy")} - {format(months[months.length - 1], "MMMM yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {months.map((month, idx) => (
          <div key={idx} className="border rounded-lg p-2 sm:p-4">
            <h3 className="font-semibold text-base sm:text-lg text-center mb-2 sm:mb-4">
              {format(month, "MMMM yyyy")}
            </h3>
            <CalendarGrid 
              currentMonth={month} 
              selectedSessions={selectedSessions}
              compact
            />
          </div>
        ))}
      </div>

      <div className="border-t pt-4 sm:pt-6">
        <h2 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Selected Sessions</h2>
        <div className="space-y-2 sm:space-y-3">
          {selectedSessions.map((session) => (
            <div 
              key={session.sessionId}
              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg"
            >
              <div 
                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full shrink-0"
                style={{ backgroundColor: session.color || "#5B2C6F" }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base truncate">{session.campName}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{session.sessionName}</p>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground shrink-0">
                {format(parseISO(session.startDate), "MMM d")} - {format(parseISO(session.endDate), "MMM d")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DateRangePicker({
  dateRange,
  onDateRangeChange
}: {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}) {
  const [startDate, setStartDate] = useState(dateRange.start);
  const [endDate, setEndDate] = useState(dateRange.end);
  const [isOpen, setIsOpen] = useState(false);

  const isValidRange = parseISO(startDate) <= parseISO(endDate);
  
  const handleApply = () => {
    if (!isValidRange) return;
    onDateRangeChange({ start: startDate, end: endDate });
    setIsOpen(false);
  };

  const presets = [
    { label: "Summer 2026", start: "2026-06-01", end: "2026-08-31" },
    { label: "June - July", start: "2026-06-01", end: "2026-07-31" },
    { label: "July - August", start: "2026-07-01", end: "2026-08-31" },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 text-xs sm:text-sm border-eggplant/30 hover:border-eggplant"
          data-testid="button-date-range"
        >
          <CalendarRange className="w-3 h-3 sm:w-4 sm:h-4 text-eggplant" />
          <span>
            {format(parseISO(dateRange.start), "MMM d")} - {format(parseISO(dateRange.end), "MMM d, yyyy")}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 sm:w-80 p-4" align="start">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Set Calendar View</h4>
          
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setStartDate(preset.start);
                  setEndDate(preset.end);
                }}
                data-testid={`button-preset-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-date" className="text-xs">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm"
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-date" className="text-xs">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm"
                data-testid="input-end-date"
              />
            </div>
          </div>
          
          {!isValidRange && (
            <p className="text-xs text-destructive">End date must be after start date</p>
          )}
          <Button 
            onClick={handleApply} 
            disabled={!isValidRange}
            className="w-full bg-eggplant hover:bg-eggplant-light disabled:opacity-50"
            data-testid="button-apply-date-range"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function SessionCalendar({
  selectedSessions,
  dateRange,
  onDateRangeChange,
  onRemoveSession
}: SessionCalendarProps) {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(() => {
    return dateRange.start ? parseISO(dateRange.start) : new Date();
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [sessionToRemove, setSessionToRemove] = useState<SelectedSession | null>(null);
  const [showOverlapAlert, setShowOverlapAlert] = useState(false);

  const overlaps = useMemo(() => detectOverlaps(selectedSessions), [selectedSessions]);

  const summerMonths = useMemo(() => {
    const start = parseISO(dateRange.start);
    const end = parseISO(dateRange.end);
    const months: Date[] = [];
    let current = startOfMonth(start);
    while (current <= end) {
      months.push(current);
      current = addMonths(current, 1);
    }
    return months;
  }, [dateRange]);

  const monthCount = differenceInMonths(parseISO(dateRange.end), parseISO(dateRange.start)) + 1;

  const handlePrint = () => {
    window.print();
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleRemoveWithConfirmation = (session: SelectedSession) => {
    setSessionToRemove(session);
  };

  const confirmRemove = () => {
    if (sessionToRemove) {
      onRemoveSession(sessionToRemove.sessionId);
      toast({
        title: "Session removed",
        description: `${sessionToRemove.sessionName} has been removed from your schedule.`,
      });
      setSessionToRemove(null);
    }
  };

  const isEmpty = selectedSessions.length === 0;

  return (
    <>
      <Card className="bg-white border-border/50 shadow-paper" data-testid="card-calendar">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-eggplant" />
              <span className="font-semibold text-lg text-eggplant">Your Schedule</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker 
              dateRange={dateRange} 
              onDateRangeChange={onDateRangeChange} 
            />
            <span className="text-xs text-muted-foreground">
              {monthCount} month{monthCount > 1 ? "s" : ""}
            </span>
            <div className="flex-1" />
            <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  title="Expand view"
                  data-testid="button-expand-calendar"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="text-eggplant flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Summer Schedule - Detailed View
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[calc(90vh-180px)]">
                  <div className="p-2">
                    {overlaps.length > 0 && (
                      <div className="mb-4 p-3 bg-gold/10 border border-gold/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-gold-dark shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-gold-dark">Schedule Conflicts Detected</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {overlaps.length} overlapping session{overlaps.length > 1 ? "s" : ""} found
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {isEmpty ? (
                      <p className="text-muted-foreground text-center py-8">No sessions selected yet</p>
                    ) : (
                      <WeeklyCalendarView 
                        sessions={selectedSessions}
                        months={summerMonths}
                        overlaps={overlaps}
                        onRemove={(id) => {
                          const session = selectedSessions.find(s => s.sessionId === id);
                          if (session) handleRemoveWithConfirmation(session);
                        }}
                      />
                    )}
                  </div>
                </ScrollArea>
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsExpanded(false)}
                    data-testid="button-close-expanded"
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={handlePrint}
                    className="bg-eggplant hover:bg-eggplant-light"
                    data-testid="button-print-expanded"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Schedule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={handlePrint}
              title="Print schedule"
              data-testid="button-print"
            >
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-4 sm:px-6">
          {overlaps.length > 0 && (
            <button
              onClick={() => setShowOverlapAlert(true)}
              className="w-full flex items-center gap-2 p-2 bg-gold/10 border border-gold/30 rounded-lg hover:bg-gold/20 transition-colors"
              data-testid="button-show-overlaps"
            >
              <AlertTriangle className="w-4 h-4 text-gold-dark" />
              <span className="text-sm font-medium text-gold-dark">
                {overlaps.length} schedule conflict{overlaps.length > 1 ? "s" : ""} - tap to view
              </span>
            </button>
          )}

          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handlePrevMonth}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium text-sm sm:text-base">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleNextMonth}
              data-testid="button-next-month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <CalendarGrid 
            currentMonth={currentMonth}
            selectedSessions={selectedSessions}
            onDayClick={() => setIsExpanded(true)}
          />

          <div className="border-t pt-3 sm:pt-4">
            <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
              Selected Sessions ({selectedSessions.length})
            </h4>
            {isEmpty ? (
              <div className="py-4 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  No sessions selected yet
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Browse camps and add sessions to your calendar
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedSessions.map((session) => (
                  <div 
                    key={session.sessionId}
                    className="flex items-center gap-2 p-2 bg-muted/30 rounded-md group"
                  >
                    <div 
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: session.color || "#5B2C6F" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{session.campName}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {session.sessionName} &bull; {format(parseISO(session.startDate), "MMM d")} - {format(parseISO(session.endDate), "MMM d")}
                        {session.price !== null && session.price !== undefined && (
                          <> &bull; ${session.price}</>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-7 w-7 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveWithConfirmation(session)}
                      data-testid={`button-remove-session-${session.sessionId}`}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!sessionToRemove} onOpenChange={(open) => !open && setSessionToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{sessionToRemove?.sessionName}</strong> from {sessionToRemove?.campName} from your schedule?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-remove">Keep it</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemove}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-remove"
            >
              Yes, remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showOverlapAlert} onOpenChange={setShowOverlapAlert}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gold-dark">
              <AlertTriangle className="w-5 h-5" />
              Schedule Conflicts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The following sessions have overlapping dates:
            </p>
            {overlaps.map((overlap, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: overlap.session1.color }} />
                  <span className="font-medium">{overlap.session1.campName}</span>
                </div>
                <p className="text-xs text-muted-foreground ml-4">
                  {format(parseISO(overlap.session1.startDate), "MMM d")} - {format(parseISO(overlap.session1.endDate), "MMM d")}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: overlap.session2.color }} />
                  <span className="font-medium">{overlap.session2.campName}</span>
                </div>
                <p className="text-xs text-muted-foreground ml-4">
                  {format(parseISO(overlap.session2.startDate), "MMM d")} - {format(parseISO(overlap.session2.endDate), "MMM d")}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setShowOverlapAlert(false)} data-testid="button-close-overlap-alert">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-calendar, #printable-calendar * {
            visibility: visible;
          }
          #printable-calendar {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <div className="hidden print:block">
        <PrintableCalendar 
          selectedSessions={selectedSessions}
          months={summerMonths}
        />
      </div>
    </>
  );
}
