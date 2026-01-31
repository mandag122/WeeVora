import { useState, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, Maximize2, Printer, Trash2, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  differenceInMonths
} from "date-fns";

interface SessionCalendarProps {
  selectedSessions: SelectedSession[];
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onRemoveSession: (sessionId: string) => void;
}

function CalendarGrid({
  currentMonth,
  selectedSessions,
  compact = false
}: {
  currentMonth: Date;
  selectedSessions: SelectedSession[];
  compact?: boolean;
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
          
          return (
            <div
              key={idx}
              className={`
                relative p-0.5 sm:p-1 rounded-md border border-transparent
                ${compact ? "min-h-[32px] sm:min-h-[40px]" : "min-h-[50px] sm:min-h-[80px]"}
                ${!isCurrentMonth ? "opacity-30" : ""}
                ${isToday ? "border-eggplant bg-eggplant/5" : ""}
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

function MultiMonthCalendar({ 
  selectedSessions,
  months 
}: { 
  selectedSessions: SelectedSession[];
  months: Date[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {months.map((month, idx) => (
          <div key={idx} className="border rounded-lg p-2 sm:p-4">
            <h3 className="font-semibold text-base sm:text-lg text-center mb-2 sm:mb-4 text-eggplant">
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
        <p className="text-sm sm:text-base text-muted-foreground">Planned activities for your family</p>
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
          className="gap-2 text-xs sm:text-sm"
          data-testid="button-date-range"
        >
          <CalendarRange className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">
            {format(parseISO(dateRange.start), "MMM d")} - {format(parseISO(dateRange.end), "MMM d, yyyy")}
          </span>
          <span className="sm:hidden">
            {format(parseISO(dateRange.start), "M/d")} - {format(parseISO(dateRange.end), "M/d")}
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
  const [currentMonth, setCurrentMonth] = useState(() => {
    return dateRange.start ? parseISO(dateRange.start) : new Date();
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"single" | "multi">("single");

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

  const isEmpty = selectedSessions.length === 0;

  return (
    <>
      <Card className="bg-white border-border/50 shadow-paper" data-testid="card-calendar">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-eggplant flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              Your Schedule
            </CardTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <DateRangePicker 
                dateRange={dateRange} 
                onDateRangeChange={onDateRangeChange} 
              />
              <Button
                variant={viewMode === "multi" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode(viewMode === "single" ? "multi" : "single")}
                className="text-xs"
                data-testid="button-toggle-view"
              >
                {monthCount} months
              </Button>
              <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                    data-testid="button-expand-calendar"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="text-eggplant flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Summer Schedule
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[calc(90vh-120px)]">
                    <PrintableCalendar 
                      selectedSessions={selectedSessions}
                      months={summerMonths}
                    />
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
                data-testid="button-print"
              >
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-3 sm:px-6">
          {viewMode === "single" ? (
            <>
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
              />
            </>
          ) : (
            <MultiMonthCalendar 
              selectedSessions={selectedSessions}
              months={summerMonths}
            />
          )}

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
                      aria-label={`${session.campName} - ${session.sessionName}`}
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
                      className="shrink-0 h-7 w-7 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRemoveSession(session.sessionId)}
                      aria-label={`Remove ${session.sessionName}`}
                      data-testid={`button-remove-session-${session.sessionId}`}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
    </>
  );
}
