import { useState } from "react";
import { Plus, Check, Calendar, Sun, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Camp, RegistrationOption, SelectedSession, CampCategory } from "@shared/schema";
import { categoryColors } from "@shared/schema";
import { format, parseISO, isPast, isFuture } from "date-fns";

function getCampBannerColor(camp: Camp): string {
  if (camp.color) return camp.color;
  const firstCategory = camp.categories?.[0] as CampCategory | undefined;
  return firstCategory ? categoryColors[firstCategory] || "#5B2C6F" : "#5B2C6F";
}

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
  const [showExtended, setShowExtended] = useState(false);
  
  const hasExtendedHours = camp.extendedHours;
  const hasExtendedPricing = sessions.some(s => s.extendedPrice !== null);

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
    <Card 
        className={`border-border/50 shadow-paper transition-colors duration-300 ${
          showExtended ? "bg-sky/5 border-sky/30" : "bg-white"
        }`} 
        data-testid="card-sessions"
      >
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-lg text-eggplant flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Available Sessions
          </CardTitle>
          
          {hasExtendedHours && (
            <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors duration-300 ${
              showExtended ? "bg-sky/20" : "bg-gold/10"
            }`}>
              <Clock className={`w-4 h-4 ${!showExtended ? "text-eggplant" : "text-muted-foreground"}`} />
              <Label 
                htmlFor="extended-toggle" 
                className={`text-sm cursor-pointer ${!showExtended ? "font-semibold text-eggplant" : "text-muted-foreground"}`}
              >
                Standard
              </Label>
              <Switch
                id="extended-toggle"
                checked={showExtended}
                onCheckedChange={setShowExtended}
                data-testid="switch-extended-hours"
              />
              <Sun className={`w-4 h-4 ${showExtended ? "text-sky" : "text-muted-foreground"}`} />
              <Label 
                htmlFor="extended-toggle" 
                className={`text-sm cursor-pointer ${showExtended ? "font-semibold text-sky" : "text-muted-foreground"}`}
              >
                Extended
              </Label>
            </div>
          )}
        </div>
        
        {hasExtendedHours && (
          <div className={`mt-3 p-3 rounded-lg transition-colors duration-300 ${
            showExtended ? "bg-sky/10" : "bg-eggplant/5"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {showExtended ? (
                <Sun className="w-5 h-5 text-sky" />
              ) : (
                <Clock className="w-5 h-5 text-eggplant" />
              )}
              <span className={`text-sm font-semibold ${showExtended ? "text-sky" : "text-eggplant"}`}>
                {showExtended ? "Extended Hours" : "Standard Hours"}
              </span>
            </div>
            <p className={`text-lg font-bold ${showExtended ? "text-sky" : "text-eggplant"}`}>
              {showExtended 
                ? (camp.extendedHoursInfo || "Extended hours available")
                : (camp.campHours || "Regular camp hours")
              }
            </p>
            {showExtended && !hasExtendedPricing && (
              <p className="text-xs text-muted-foreground mt-1">(pricing not yet available for extended hours)</p>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.map((session) => {
          const standardSelected = selectedSessions.find(
            (s) => s.sessionId === session.id && !s.isExtended
          );
          const extendedSelected = selectedSessions.find(
            (s) => s.sessionId === `${session.id}-ext` && s.isExtended
          );
          
          const isSelected = showExtended ? !!extendedSelected : !!standardSelected;
          const status = getSessionStatus(session);
          const startDate = session.startDate ? parseISO(session.startDate) : null;
          const endDate = session.endDate ? parseISO(session.endDate) : null;
          
          const displayPrice = showExtended ? session.extendedPrice : session.price;
          const hasExtendedOption = session.extendedPrice !== null;

          const handleToggle = () => {
            if (!startDate || !endDate) return;
            
            const bannerColor = getCampBannerColor(camp);
            if (showExtended && hasExtendedOption) {
              onToggleSession({
                campId: camp.id,
                campName: camp.name,
                sessionId: `${session.id}-ext`,
                sessionName: `${session.sessionName} (Extended)`,
                startDate: session.startDate!,
                endDate: session.endDate!,
                color: session.color || bannerColor,
                isExtended: true,
                price: session.extendedPrice
              });
            } else {
              onToggleSession({
                campId: camp.id,
                campName: camp.name,
                sessionId: session.id,
                sessionName: session.sessionName,
                startDate: session.startDate!,
                endDate: session.endDate!,
                color: session.color || bannerColor,
                isExtended: false,
                price: session.price
              });
            }
          };

          const showDisabledForExtended = showExtended && !hasExtendedOption;

          return (
            <div
              key={session.id}
              className={`
                p-4 rounded-lg border transition-all
                ${isSelected 
                  ? "border-eggplant bg-eggplant/5" 
                  : "border-border/50 hover:border-eggplant/30"
                }
                ${!status.canSelect || showDisabledForExtended ? "opacity-60" : ""}
              `}
              data-testid={`session-${session.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                    {standardSelected && !showExtended && (
                      <Badge variant="secondary" className="shrink-0 text-xs bg-eggplant/10 text-eggplant">
                        Selected
                      </Badge>
                    )}
                    {extendedSelected && showExtended && (
                      <Badge variant="secondary" className="shrink-0 text-xs bg-gold/20 text-gold-dark">
                        Extended Selected
                      </Badge>
                    )}
                    {standardSelected && showExtended && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        Standard Added
                      </Badge>
                    )}
                    {extendedSelected && !showExtended && (
                      <Badge variant="outline" className="shrink-0 text-xs border-gold text-gold-dark">
                        Extended Added
                      </Badge>
                    )}
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
                    {displayPrice !== null && (
                      <span className="font-medium text-eggplant">
                        ${displayPrice}
                      </span>
                    )}
                    {showDisabledForExtended && (
                      <span className="italic text-muted-foreground">
                        Extended hours not available
                      </span>
                    )}
                  </div>
                </div>

                {startDate && endDate && status.canSelect && !showDisabledForExtended && (
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={`shrink-0 ${
                      isSelected 
                        ? showExtended 
                          ? "bg-gold hover:bg-gold-dark text-eggplant-dark" 
                          : "bg-eggplant hover:bg-eggplant-light"
                        : "border-eggplant text-eggplant hover:bg-eggplant hover:text-white"
                    }`}
                    onClick={handleToggle}
                    data-testid={`button-toggle-session-${session.id}${showExtended ? "-ext" : ""}`}
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
