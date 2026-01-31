import { Link } from "wouter";
import { MapPin, Clock, Users, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { Camp } from "@shared/schema";
import { categoryColors, type CampCategory } from "@shared/schema";
import { format, parseISO, isPast, isFuture } from "date-fns";

interface CampCardProps {
  camp: Camp;
  onAddToCalendar?: () => void;
}

function getRegistrationStatus(camp: Camp): { 
  status: "open" | "closed" | "upcoming" | "waitlist" | "unknown";
  text: string;
  dotColor: string;
} {
  if (camp.registrationCloses && isPast(parseISO(camp.registrationCloses))) {
    return { status: "closed", text: "Registration closed", dotColor: "bg-red-500" };
  }
  if (camp.registrationOpens && isFuture(parseISO(camp.registrationOpens))) {
    const date = format(parseISO(camp.registrationOpens), "MMM d");
    return { status: "upcoming", text: `Opens ${date}`, dotColor: "bg-yellow-500" };
  }
  if (camp.waitlistOnly) {
    return { status: "waitlist", text: "Waitlist only", dotColor: "bg-red-500" };
  }
  if (camp.registrationCloses) {
    const date = format(parseISO(camp.registrationCloses), "MMM d");
    return { status: "open", text: `Closes ${date}`, dotColor: "bg-green-500" };
  }
  return { status: "unknown", text: "Registration details TBA", dotColor: "" };
}

export function CampCard({ camp }: CampCardProps) {
  const regStatus = getRegistrationStatus(camp);
  const hasRegistrationInfo = regStatus.status !== "unknown";
  
  const ageRange = camp.ageMin && camp.ageMax 
    ? `Ages ${camp.ageMin}-${camp.ageMax}` 
    : camp.ageMin 
      ? `Ages ${camp.ageMin}+` 
      : null;

  const priceRange = camp.priceMin && camp.priceMax 
    ? `$${camp.priceMin}-$${camp.priceMax}`
    : camp.priceMin 
      ? `From $${camp.priceMin}`
      : null;

  return (
    <Card 
      className={`group relative overflow-visible bg-white border-border/50 shadow-paper hover:shadow-paper-hover transition-all duration-300 hover:-translate-y-2 ${
        !hasRegistrationInfo ? "opacity-60" : ""
      }`}
      data-testid={`card-camp-${camp.id}`}
    >
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-eggplant truncate group-hover:text-eggplant-light transition-colors" data-testid={`text-camp-name-${camp.id}`}>
              {camp.name}
            </h3>
            {camp.organization && (
              <p className="text-sm text-muted-foreground truncate" data-testid={`text-camp-org-${camp.id}`}>
                {camp.organization}
              </p>
            )}
          </div>
          {hasRegistrationInfo && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`w-2 h-2 rounded-full ${regStatus.dotColor}`} />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {regStatus.text}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {camp.categories.slice(0, 3).map((category) => (
            <Badge 
              key={category}
              variant="secondary"
              className="text-xs font-medium"
              style={{ 
                backgroundColor: `${categoryColors[category as CampCategory]}15`,
                color: categoryColors[category as CampCategory] || "inherit"
              }}
              data-testid={`badge-category-${category}`}
            >
              {category}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {ageRange && (
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky" />
              <span>{ageRange}</span>
            </div>
          )}
          {camp.locationCity && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-coral" />
              <span>{camp.locationCity}</span>
            </div>
          )}
          {camp.campHours && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-forest" />
              <span>{camp.campHours}</span>
            </div>
          )}
        </div>

        {!hasRegistrationInfo && (
          <p className="text-sm text-muted-foreground italic">
            Registration details not yet available
          </p>
        )}

        {priceRange && (
          <div className="text-sm font-medium text-eggplant">
            {priceRange}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t border-border/30 flex gap-2">
        <Link href={`/camps/${camp.slug}`} className="flex-1">
          <Button 
            variant="ghost" 
            className="w-full text-eggplant hover:text-eggplant-light hover:bg-eggplant/5"
            data-testid={`button-view-details-${camp.id}`}
          >
            View Details
          </Button>
        </Link>
        {camp.websiteUrl && (
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => window.open(camp.websiteUrl!, "_blank")}
            data-testid={`button-external-${camp.id}`}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
