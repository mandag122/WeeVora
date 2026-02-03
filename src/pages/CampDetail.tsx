import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, MapPin, Clock, Users, Calendar, DollarSign, ExternalLink, Info } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SessionSelector } from "@/components/SessionSelector";
import { SessionCalendar } from "@/components/SessionCalendar";
import { MobileCalendarFAB } from "@/components/MobileCalendarFAB";
import { CampCard } from "@/components/CampCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import type { Camp, RegistrationOption } from "@shared/schema";
import { categoryColors, type CampCategory } from "@shared/schema";
import { useSessionContext } from "@/context/SessionContext";
import { format, isPast, isFuture } from "date-fns";
import { safeParseISO } from "@/lib/dateUtils";
import { trackRegisterWebsiteClick, trackViewAvailableSessions } from "@/lib/analytics";
import ReactMarkdown from "react-markdown";

function getRegistrationStatus(camp: Camp) {
  const regCloses = safeParseISO(camp.registrationCloses);
  if (regCloses && isPast(regCloses)) {
    return { status: "closed", text: "Registration Closed", color: "bg-red-100 text-red-700" };
  }
  const regOpens = safeParseISO(camp.registrationOpens);
  if (regOpens && isFuture(regOpens)) {
    return { status: "upcoming", text: `Opens ${format(regOpens, "MMMM d, yyyy")}`, color: "bg-yellow-100 text-yellow-700" };
  }
  if (camp.waitlistOnly) {
    return { status: "waitlist", text: "WAITLIST ONLY", color: "bg-rose text-white" };
  }
  if (regCloses) {
    return { status: "open", text: `Open until ${format(regCloses, "MMMM d, yyyy")}`, color: "bg-green-100 text-green-700" };
  }
  return null;
}

export default function CampDetail() {
  const [, params] = useRoute("/camps/:slug");
  const slug = params?.slug;
  
  const session = useSessionContext();
  const selectedSessions = session?.selectedSessions ?? [];
  const dateRange = session?.dateRange ?? { start: "2026-06-01", end: "2026-08-31" };
  const toggleSession = session?.toggleSession ?? (() => {});
  const removeSession = session?.removeSession ?? (() => {});
  const setDateRange = session?.setDateRange ?? (() => {});
  const clearAllSessions = session?.clearAllSessions ?? (() => {});
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const { data: camp, isLoading: campLoading, error: campError } = useQuery<Camp>({
    queryKey: ["/api/camps", slug],
    enabled: !!slug
  });

  const { data: sessions = [] } = useQuery<RegistrationOption[]>({
    queryKey: ["/api/camps", slug, "sessions"],
    enabled: !!slug
  });

  const { data: similarCamps = [] } = useQuery<Camp[]>({
    queryKey: ["/api/camps", slug, "similar"],
    enabled: !!slug
  });

  // Schema.org JSON-LD for SEO - must run before early returns so hook count stays consistent
  useEffect(() => {
    if (!camp) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": camp.name,
      "description": camp.description || `Summer camp in ${camp.locationCity || "Lake County"}, Illinois`,
      "url": `https://www.weevora.com/camps/${camp.slug}`,
      ...(camp.seasonStart && { "startDate": camp.seasonStart }),
      ...(camp.seasonEnd && { "endDate": camp.seasonEnd }),
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "eventStatus": "https://schema.org/EventScheduled",
      ...(camp.locationCity && {
        "location": {
          "@type": "Place",
          "name": camp.organization || camp.name,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": camp.locationCity,
            "addressRegion": "IL",
            "addressCountry": "US",
            ...(camp.locationAddress && { "streetAddress": camp.locationAddress })
          }
        }
      }),
      ...(camp.organization && {
        "organizer": {
          "@type": "Organization",
          "name": camp.organization,
          ...(camp.websiteUrl && { "url": camp.websiteUrl })
        }
      }),
      ...((camp.priceMin || camp.priceMax) && {
        "offers": {
          "@type": "Offer",
          "url": camp.websiteUrl || `https://www.weevora.com/camps/${camp.slug}`,
          "availability": camp.waitlistOnly
            ? "https://schema.org/LimitedAvailability"
            : "https://schema.org/InStock",
          "priceCurrency": "USD",
          ...(camp.priceMin && { "lowPrice": camp.priceMin }),
          ...(camp.priceMax && { "highPrice": camp.priceMax }),
          ...(camp.priceMin && !camp.priceMax && { "price": camp.priceMin })
        }
      }),
      ...((camp.ageMin || camp.ageMax) && {
        "typicalAgeRange": camp.ageMin && camp.ageMax
          ? `${camp.ageMin}-${camp.ageMax}`
          : camp.ageMin
            ? `${camp.ageMin}+`
            : undefined
      })
    };

    const cleanSchema = JSON.parse(JSON.stringify(schema));

    const scriptId = "camp-schema-json-ld";
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = scriptId;
      scriptEl.type = "application/ld+json";
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(cleanSchema);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [camp]);

  if (campLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-96" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (campError || !camp) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-foreground mb-4">Camp Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The camp you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/camps">
              <Button className="bg-eggplant hover:bg-eggplant-light">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Camps
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const regStatus = getRegistrationStatus(camp);

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="page-camp-detail">
      <Header />
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-20 md:pb-8">
        <Breadcrumb className="mb-4 sm:mb-6 text-sm">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/camps">Camps</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{camp.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card className={`shadow-paper overflow-hidden ${camp.waitlistOnly ? "bg-rose/15 border-rose/30 border" : "bg-white border-border/50"}`}>
              <div 
                className="h-4"
                style={{ backgroundColor: camp.waitlistOnly ? "hsl(340 65% 47%)" : (camp.color || "#5B2C6F") }}
              />
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-eggplant mb-1" data-testid="text-camp-name">
                      {camp.name}
                    </h1>
                    {camp.organization && (
                      <p className="text-sm sm:text-lg text-muted-foreground">
                        {camp.organization}
                      </p>
                    )}
                  </div>
                  {regStatus && (
                    <Badge className={`${regStatus.color} text-sm px-3 py-1`}>
                      {regStatus.text}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {camp.categories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="text-sm"
                      style={{
                        backgroundColor: `${categoryColors[category as CampCategory]}15`,
                        color: categoryColors[category as CampCategory] || "inherit"
                      }}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-border/30">
                  {(camp.ageMin || camp.ageMax) && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-sky/10">
                        <Users className="w-5 h-5 text-sky" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ages</p>
                        <p className="font-medium">
                          {camp.ageMin && camp.ageMax 
                            ? `${camp.ageMin} - ${camp.ageMax} years`
                            : camp.ageMin 
                              ? `${camp.ageMin}+ years`
                              : `Up to ${camp.ageMax} years`
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {camp.locationCity && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-coral/10">
                        <MapPin className="w-5 h-5 text-coral" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{camp.locationCity}</p>
                        {camp.locationAddress && (
                          <p className="text-sm text-muted-foreground">{camp.locationAddress}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {camp.campHours && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-forest/10">
                        <Clock className="w-5 h-5 text-forest" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Camp Hours</p>
                        <p className="font-medium">{camp.campHours}</p>
                        {camp.extendedHours && camp.extendedHoursInfo && (
                          <p className="text-sm text-muted-foreground">Extended: {camp.extendedHoursInfo}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {(camp.priceMin || camp.priceMax) && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-gold/10">
                        <DollarSign className="w-5 h-5 text-gold-dark" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Price Range</p>
                        <p className="font-medium">
                          {camp.priceMin && camp.priceMax
                            ? `$${camp.priceMin} - $${camp.priceMax}`
                            : camp.priceMin
                              ? `From $${camp.priceMin}`
                              : `Up to $${camp.priceMax}`
                          }
                        </p>
                        {camp.siblingDiscountNote && (
                          <p className="text-sm text-muted-foreground">{camp.siblingDiscountNote}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {camp.seasonStart && camp.seasonEnd && (() => {
                    const start = safeParseISO(camp.seasonStart);
                    const end = safeParseISO(camp.seasonEnd);
                    if (!start || !end) return null;
                    return (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-rose/10">
                        <Calendar className="w-5 h-5 text-rose" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Season</p>
                        <p className="font-medium">
                          {format(start, "MMM d")} - {format(end, "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    );
                  })()}
                </div>

                <div className="pt-4 flex flex-wrap gap-3">
                  <Button
                    className="bg-eggplant text-white font-semibold rounded-full px-6"
                    onClick={() => {
                      trackViewAvailableSessions({ campId: camp.id, campName: camp.name });
                      document.getElementById("available-sessions")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    data-testid="button-view-sessions"
                  >
                    View Available Sessions
                  </Button>
                  {camp.websiteUrl && (
                    <Button
                      className="bg-gold text-eggplant-dark font-semibold rounded-full px-6"
                      onClick={() => {
                        trackRegisterWebsiteClick({
                          campId: camp.id,
                          campName: camp.name,
                          url: camp.websiteUrl!,
                        });
                        window.open(camp.websiteUrl!, "_blank");
                      }}
                      data-testid="button-register"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Register on Website
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {camp.description && (
              <Card className="bg-white border-border/50 shadow-paper">
                <CardHeader>
                  <CardTitle className="text-lg text-eggplant flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    About This Camp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2">
                    <ReactMarkdown>{camp.description}</ReactMarkdown>
                  </div>
                  {camp.additionalInfo && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {camp.additionalInfo}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div id="available-sessions">
              <SessionSelector
                camp={camp}
                sessions={sessions}
                selectedSessions={selectedSessions}
                onToggleSession={toggleSession}
              />
            </div>

            {similarCamps.length > 0 && (
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold text-eggplant">
                  You might also like
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {similarCamps.slice(0, 4).map(similar => (
                    <CampCard key={similar.id} camp={similar} source="similar" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <SessionCalendar
              selectedSessions={selectedSessions}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onRemoveSession={removeSession}
              onClearAll={clearAllSessions}
            />
          </div>
        </div>
      </main>
      <Footer />
      <MobileCalendarFAB />
    </div>
  );
}
