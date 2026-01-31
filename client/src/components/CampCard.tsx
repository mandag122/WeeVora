import { Link } from "wouter";
import { MapPin, Clock, Users, ExternalLink, Sun } from "lucide-react";
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
  badgeClass: string;
} {
  if (camp.registrationCloses && isPast(parseISO(camp.registrationCloses))) {
    return { status: "closed", text: "Closed", badgeClass: "bg-red-500 text-white" };
  }
  if (camp.waitlistOnly) {
    return { status: "waitlist", text: "Waitlist Only", badgeClass: "bg-gold text-white" };
  }
  if (camp.registrationOpens && isFuture(parseISO(camp.registrationOpens))) {
    const date = format(parseISO(camp.registrationOpens), "MMM d");
    return { status: "upcoming", text: `Opens ${date}`, badgeClass: "bg-yellow-500 text-white" };
  }
  if (camp.registrationOpens && isPast(parseISO(camp.registrationOpens))) {
    return { status: "open", text: "Registration Open", badgeClass: "bg-forest text-white" };
  }
  return { status: "unknown", text: "", badgeClass: "" };
}

export function CampCard({ camp }: CampCardProps) {
  const regStatus = getRegistrationStatus(camp);
  const hasRegistrationOpens = !!camp.registrationOpens;
  
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
        !hasRegistrationOpens ? "opacity-60" : ""
      }`}
      data-testid={`card-camp-${camp.id}`}
    >
      <CardHeader className="pb-3 space-y-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-lg text-eggplant group-hover:text-eggplant-light transition-colors" data-testid={`text-camp-name-${camp.id}`}>
            {camp.name}
          </h3>
          {camp.organization && (
            <p className="text-sm text-muted-foreground truncate" data-testid={`text-camp-org-${camp.id}`}>
              {camp.organization}
            </p>
          )}
          {regStatus.text && (
            <Badge 
              className={`${regStatus.badgeClass} text-xs font-medium mt-1`}
              data-testid={`badge-status-${camp.id}`}
            >
              {regStatus.text}
            </Badge>
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

        {camp.extendedHours && camp.extendedHoursInfo && (
          <div className="flex items-center gap-1.5 text-sm text-gold-dark">
            <Sun className="w-4 h-4" />
            <span>Extended hours: {camp.extendedHoursInfo}</span>
          </div>
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
