import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CampCard } from "@/components/CampCard";
import { CampFilters } from "@/components/CampFilters";
import { SessionCalendar } from "@/components/SessionCalendar";
import { MobileCalendarFAB } from "@/components/MobileCalendarFAB";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Camp, FilterState } from "@shared/schema";
import { useSessionContext } from "@/context/SessionContext";
import { parseISO, isPast, isFuture } from "date-fns";
import { safeParseISO } from "@/lib/dateUtils";

const defaultFilters: FilterState = {
  search: "",
  categories: [],
  ageMin: null,
  ageMax: null,
  locations: [],
  priceMin: null,
  priceMax: null,
  registrationStatus: "all",
  extendedHoursOnly: false,
  campSchedule: [],
  dateStart: null,
  dateEnd: null,
};

type SortOption = "registration" | "name-asc" | "name-desc";

const SORT_OPTIONS: SortOption[] = ["registration", "name-asc", "name-desc"];

function parseFiltersAndSortFromSearch(search: string): { filters: FilterState; sortBy: SortOption } {
  const params = new URLSearchParams(search);
  const get = (k: string) => params.get(k);
  const getNum = (k: string) => {
    const v = params.get(k);
    if (v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const getList = (k: string) => {
    const v = params.get(k);
    if (!v) return [];
    return v.split(",").map((s) => decodeURIComponent(s.trim())).filter(Boolean);
  };
  const locationSingle = get("location");
  const locations = locationSingle ? [locationSingle] : getList("locations");
  const status = get("status");
  const registrationStatus = status === "open" || status === "upcoming" ? status : "all";
  return {
    filters: {
      search: get("search") ?? "",
      categories: getList("categories"),
      ageMin: getNum("ageMin"),
      ageMax: getNum("ageMax"),
      locations,
      priceMin: getNum("priceMin"),
      priceMax: getNum("priceMax"),
      registrationStatus,
      extendedHoursOnly: params.get("extended") === "1",
      campSchedule: getList("schedule"),
      dateStart: get("dateStart") || null,
      dateEnd: get("dateEnd") || null,
    },
    sortBy: SORT_OPTIONS.includes(get("sort") as SortOption) ? (get("sort") as SortOption) : "registration",
  };
}

function filtersAndSortToSearch(filters: FilterState, sortBy: SortOption): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.categories.length) params.set("categories", filters.categories.map(encodeURIComponent).join(","));
  if (filters.ageMin != null) params.set("ageMin", String(filters.ageMin));
  if (filters.ageMax != null) params.set("ageMax", String(filters.ageMax));
  if (filters.locations.length) params.set("locations", filters.locations.map(encodeURIComponent).join(","));
  if (filters.priceMin != null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) params.set("priceMax", String(filters.priceMax));
  if (filters.registrationStatus !== "all") params.set("status", filters.registrationStatus);
  if (filters.extendedHoursOnly) params.set("extended", "1");
  if (filters.campSchedule.length) params.set("schedule", filters.campSchedule.map(encodeURIComponent).join(","));
  if (filters.dateStart) params.set("dateStart", filters.dateStart);
  if (filters.dateEnd) params.set("dateEnd", filters.dateEnd);
  if (sortBy !== "registration") params.set("sort", sortBy);
  const q = params.toString();
  return q ? `?${q}` : "";
}

/** True if camp id is in the list from /api/camp-ids-with-option-name (option_name in Registration_Options). */
function campHasOptionName(campId: string, idsSet: Set<string>): boolean {
  return idsSet.has(campId);
}

export default function Camps() {
  const [location] = useLocation();

  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window === "undefined") return defaultFilters;
    const { filters: f } = parseFiltersAndSortFromSearch(window.location.search);
    return f;
  });
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    if (typeof window === "undefined") return "registration";
    const { sortBy: s } = parseFiltersAndSortFromSearch(window.location.search);
    return s;
  });

  // ✅ SAFETY: context can be undefined / partially-initialized during refactors.
  const session = useSessionContext?.();
  const selectedSessions = session?.selectedSessions ?? [];
  const removeSession = session?.removeSession ?? (() => {});
  const setDateRange = session?.setDateRange ?? (() => {});
  const clearAllSessions = session?.clearAllSessions ?? (() => {});

  // ✅ THE IMPORTANT ONE: never let this be undefined
  const dateRange = (session as any)?.dateRange ?? [null, null];

  // Sync filters/sort from URL when returning to this page (e.g. back from camp detail)
  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const { filters: f, sortBy: s } = parseFiltersAndSortFromSearch(search);
    setFilters(f);
    setSortBy(s);
  }, [location]);

  // Push current filters/sort to URL so back button restores this view
  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = location.startsWith("/camps") ? "/camps" : location.split("?")[0];
    const search = filtersAndSortToSearch(filters, sortBy);
    const url = `${path}${search}`;
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(null, "", url);
    }
  }, [location, filters, sortBy]);

  const { data, isLoading, error } = useQuery<Camp[]>({
    queryKey: ["/api/camps"],
  });

  const { data: campIdsWithOptionName = [] } = useQuery<string[]>({
    queryKey: ["/api/camp-ids-with-option-name"],
  });

  const camps = Array.isArray(data) ? data : [];
  const idsWithOptionNameSet = useMemo(
    () => new Set(Array.isArray(campIdsWithOptionName) ? campIdsWithOptionName : []),
    [campIdsWithOptionName]
  );

  const uniqueLocations = useMemo(() => {
    const cities = camps
      .map((c) => c.locationCity)
      .filter((city): city is string => !!city);
    return Array.from(new Set(cities)).sort();
  }, [camps]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredCamps = useMemo(() => {
    return camps.filter((camp) => {
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch =
          camp.name?.toLowerCase().includes(search) ||
          camp.organization?.toLowerCase().includes(search) ||
          camp.description?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      if (filters.categories.length > 0) {
        const campCategories = camp.categories ?? [];
        const hasCategory = campCategories.some((c) =>
          filters.categories.includes(c),
        );
        if (!hasCategory) return false;
      }

      if (filters.locations.length > 0) {
        if (!camp.locationCity || !filters.locations.includes(camp.locationCity)) {
          return false;
        }
      }

      if (filters.ageMin !== null || filters.ageMax !== null) {
        const filterMin = filters.ageMin ?? 3;
        const filterMax = filters.ageMax ?? 18;
        const campMin = camp.ageMin ?? 3;
        const campMax = camp.ageMax ?? 18;
        if (campMax < filterMin || campMin > filterMax) return false;
      }

      if (filters.dateStart && filters.dateEnd) {
        const filterStart = safeParseISO(filters.dateStart);
        const filterEnd = safeParseISO(filters.dateEnd);
        const campStart = safeParseISO(camp.seasonStart);
        const campEnd = safeParseISO(camp.seasonEnd);

        if (!filterStart || !filterEnd) return true;
        if (!campStart || !campEnd) return false;
        const overlaps = campStart <= filterEnd && campEnd >= filterStart;
        if (!overlaps) return false;
      }

      if (filters.extendedHoursOnly && !camp.extendedHours) {
        return false;
      }

      if (filters.campSchedule.length > 0) {
        // Normalize so "Full time" (Airtable) matches "full-time" (filter): lowercase, collapse spaces/hyphens
        const normalize = (s: string) => (s || "").toLowerCase().trim().replace(/[\s-]+/g, "");
        const campSchedule = (camp.campSchedule ?? []).map(normalize);
        const selected = filters.campSchedule.map(normalize);
        const hasSchedule = selected.some((schedule) =>
          campSchedule.some((cs) => cs === schedule),
        );
        if (!hasSchedule) return false;
      }

      if (filters.registrationStatus !== "all") {
        const regOpens = safeParseISO(camp.registrationOpens);
        const regCloses = safeParseISO(camp.registrationCloses);

        if (filters.registrationStatus === "open") {
          // Match CampCard "Registration Open" badge: opens in past, not closed, not waitlist
          if (!regOpens || !isPast(regOpens)) return false;
          if (regCloses && isPast(regCloses)) return false;
          if (camp.waitlistOnly) return false;
        }
        if (filters.registrationStatus === "upcoming") {
          if (!regOpens || !isFuture(regOpens)) return false;
        }
      }

      return true;
    });
  }, [camps, filters]);

  const sortedCamps = useMemo(() => {
    const sorted = [...filteredCamps];

    sorted.sort((a, b) => {
      // First: camps with option_name in Registration_Options above camps without (so YMCA with options is never below Kamins/On Course without)
      const aHas = campHasOptionName(a.id, idsWithOptionNameSet);
      const bHas = campHasOptionName(b.id, idsWithOptionNameSet);
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      // Same group: respect the chosen sort (Registration Date, Name, etc.)
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "registration":
        default: {
          const aParsed = safeParseISO(a.registrationOpens);
          const bParsed = safeParseISO(b.registrationOpens);
          const aDate = aParsed ? aParsed.getTime() : Number.POSITIVE_INFINITY;
          const bDate = bParsed ? bParsed.getTime() : Number.POSITIVE_INFINITY;
          return aDate - bDate;
        }
      }
    });

    return sorted;
  }, [filteredCamps, sortBy, idsWithOptionNameSet]);

  // Inject schema.org ItemList for SEO
  useEffect(() => {
    if (!sortedCamps.length) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Summer Camps in Lake County, Illinois",
      "description": "Browse and compare summer camps for kids in Lake County, IL.",
      "numberOfItems": sortedCamps.length,
      "itemListElement": sortedCamps.slice(0, 50).map((camp, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://www.weevora.com/camps/${camp.slug}`,
        "name": camp.name
      }))
    };

    const scriptId = "camps-list-schema-json-ld";
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = scriptId;
      scriptEl.type = "application/ld+json";
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(schema);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [sortedCamps]);

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="page-camps">
      <Header />

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-eggplant mb-1 sm:mb-2"
            data-testid="text-camps-title"
          >
            Summer Camps in Lake County
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Browse and plan your family's summer activities
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <CampFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            locations={uniqueLocations}
            onClearFilters={handleClearFilters}
            resultCount={filteredCamps.length}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm text-muted-foreground" data-testid="text-results-count">
                {isLoading ? "Loading..." : `${sortedCamps.length} camp${sortedCamps.length !== 1 ? "s" : ""} found`}
              </p>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-36 sm:w-48 text-xs sm:text-sm" data-testid="select-sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registration">Registration Date</SelectItem>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error ? (
              <div className="text-center py-12" data-testid="error-state">
                <p className="text-destructive mb-4">Failed to load camps</p>
                <p className="text-muted-foreground text-sm">Please try refreshing the page</p>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg" />
                ))}
              </div>
            ) : sortedCamps.length === 0 ? (
              <div className="text-center py-12" data-testid="empty-state">
                <p className="text-lg font-medium mb-2">No camps match your filters</p>
                <p className="text-muted-foreground">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedCamps.map((camp) => (
                  <CampCard key={camp.id} camp={camp} source="list" />
                ))}
              </div>
            )}
          </div>

          <div className="w-full lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24">
              <SessionCalendar
                selectedSessions={selectedSessions}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onRemoveSession={removeSession}
                onClearAll={clearAllSessions}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileCalendarFAB />
    </div>
  );
}
