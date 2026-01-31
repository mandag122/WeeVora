import { useState, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight, Maximize2, Printer, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  endOfWeek
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
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div 
            key={day} 
            className={`text-center font-medium text-muted-foreground ${compact ? "py-1" : "py-2"}`}
          >
            {compact ? day[0] : day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const daySessions = getSessionsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={idx}
              className={`
                relative min-h-[${compact ? "40px" : "80px"}] p-1 rounded-md border border-transparent
                ${!isCurrentMonth ? "opacity-30" : ""}
                ${isToday ? "border-eggplant bg-eggplant/5" : ""}
              `}
            >
              <span className={`text-${compact ? "xs" : "sm"} ${isToday ? "font-bold text-eggplant" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </span>
              {daySessions.length > 0 && (
                <div className={`mt-1 space-y-0.5 ${compact ? "" : "space-y-1"}`}>
                  {daySessions.slice(0, compact ? 1 : 3).map((session) => (
                    <div
                      key={session.sessionId}
                      className={`${compact ? "h-1.5" : "px-1 py-0.5"} rounded text-[10px] truncate`}
                      style={{ backgroundColor: session.color || "#5B2C6F" }}
                      title={`${session.campName}: ${session.sessionName}`}
                    >
                      {!compact && (
                        <span className="text-white font-medium">
                          {session.sessionName}
                        </span>
                      )}
                    </div>
                  ))}
                  {daySessions.length > (compact ? 1 : 3) && (
                    <span className="text-[10px] text-muted-foreground">
                      +{daySessions.length - (compact ? 1 : 3)} more
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

function PrintableCalendar({ 
  selectedSessions,
  months 
}: { 
  selectedSessions: SelectedSession[];
  months: Date[];
}) {
  return (
    <div className="p-8 print:p-4" id="printable-calendar">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-eggplant mb-2">Summer Camp Schedule</h1>
        <p className="text-muted-foreground">Planned activities for your family</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {months.map((month, idx) => (
          <div key={idx} className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg text-center mb-4">
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

      <div className="border-t pt-6">
        <h2 className="font-semibold text-lg mb-4">Selected Sessions</h2>
        <div className="space-y-3">
          {selectedSessions.map((session) => (
            <div 
              key={session.sessionId}
              className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
            >
              <div 
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: session.color || "#5B2C6F" }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{session.campName}</p>
                <p className="text-sm text-muted-foreground">{session.sessionName}</p>
              </div>
              <div className="text-sm text-muted-foreground shrink-0">
                {format(parseISO(session.startDate), "MMM d")} - {format(parseISO(session.endDate), "MMM d")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
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

  const handlePrint = () => {
    window.print();
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  if (selectedSessions.length === 0) {
    return (
      <Card className="bg-white border-border/50 shadow-paper" data-testid="card-calendar-empty">
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-medium text-lg text-foreground mb-2">
            No sessions selected yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Browse camps and add sessions to see them on your calendar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white border-border/50 shadow-paper" data-testid="card-calendar">
        <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-eggplant flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Your Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  data-testid="button-expand-calendar"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
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
                <div className="flex justify-end gap-2 pt-4 border-t">
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
              onClick={handlePrint}
              data-testid="button-print"
            >
              <Printer className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrevMonth}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
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

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Selected Sessions ({selectedSessions.length})
            </h4>
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
                    <p className="text-sm font-medium truncate">{session.campName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.sessionName} &bull; {format(parseISO(session.startDate), "MMM d")} - {format(parseISO(session.endDate), "MMM d")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveSession(session.sessionId)}
                    data-testid={`button-remove-session-${session.sessionId}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
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
