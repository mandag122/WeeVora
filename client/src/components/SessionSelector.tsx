import { Plus, Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Camp, RegistrationOption, SelectedSession } from "@shared/schema";
import { format, parseISO, isPast, isFuture } from "date-fns";

interface SessionSelectorProps {
  camp: Camp;
  sessions: RegistrationOption[];
  selectedSessions: SelectedSession[];
  onToggleSession: (session: SelectedSession) => void;
}

function getSessionStatus(session: RegistrationOption): {
  status: "open" | "closed" | "upcoming" | "waitlist" | "unknown";
  text: string;
  canSelect: boolean;
} {
  if (session.registrationCloses && isPast(parseISO(session.registrationCloses))) {
    return { status: "closed", text: "Closed", canSelect: false };
  }
  if (session.registrationOpens && isFuture(parseISO(session.registrationOpens))) {
    return { status: "upcoming", text: "Coming Soon", canSelect: true };
  }
  if (session.waitlistOnly) {
    return { status: "waitlist", text: "Waitlist", canSelect: true };
  }
  return { status: "open", text: "Open", canSelect: true };
}

export function SessionSelector({
  camp,
  sessions,
  selectedSessions,
  onToggleSession
}: SessionSelectorProps) {
  if (sessions.length === 0) {
    return (
      <Card className="bg-white border-border/50 shadow-paper" data-testid="card-no-sessions">
        <CardContent className="py-8 text-center">
          <Calendar className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            No session information available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-border/50 shadow-paper" data-testid="card-sessions">
      <CardHeader>
        <CardTitle className="text-lg text-eggplant flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Available Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.map((session) => {
          const isSelected = selectedSessions.some(
            (s) => s.sessionId === session.id
          );
          const status = getSessionStatus(session);
          const startDate = session.startDate ? parseISO(session.startDate) : null;
          const endDate = session.endDate ? parseISO(session.endDate) : null;

          const handleToggle = () => {
            if (!startDate || !endDate) return;
            
            onToggleSession({
              campId: camp.id,
              campName: camp.name,
              sessionId: session.id,
              sessionName: session.sessionName,
              startDate: session.startDate!,
              endDate: session.endDate!,
              color: session.color || camp.color || "#5B2C6F"
            });
          };

          return (
            <div
              key={session.id}
              className={`
                p-4 rounded-lg border transition-all
                ${isSelected 
                  ? "border-eggplant bg-eggplant/5" 
                  : "border-border/50 hover:border-eggplant/30"
                }
                ${!status.canSelect ? "opacity-60" : ""}
              `}
              data-testid={`session-${session.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground truncate">
                      {session.sessionName}
                    </h4>
                    <Badge 
                      variant="secondary"
                      className={`shrink-0 text-xs ${
                        status.status === "open" ? "bg-green-100 text-green-700" :
                        status.status === "upcoming" ? "bg-yellow-100 text-yellow-700" :
                        status.status === "waitlist" ? "bg-orange-100 text-orange-700" :
                        "bg-red-100 text-red-700"
                      }`}
                    >
                      {status.text}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {startDate && endDate && (
                      <span>
                        {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                      </span>
                    )}
                    {session.ageMin && session.ageMax && (
                      <span>Ages {session.ageMin}-{session.ageMax}</span>
                    )}
                    {session.price && (
                      <span className="font-medium text-eggplant">
                        ${session.price}
                      </span>
                    )}
                  </div>
                </div>

                {startDate && endDate && status.canSelect && (
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={`shrink-0 ${
                      isSelected 
                        ? "bg-eggplant hover:bg-eggplant-light" 
                        : "border-eggplant text-eggplant hover:bg-eggplant hover:text-white"
                    }`}
                    onClick={handleToggle}
                    data-testid={`button-toggle-session-${session.id}`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
