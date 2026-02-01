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

export default function Camps() {
  const [location] = useLocation();

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortOption>("registration");

  // ✅ SAFETY: context can be undefined / partially-initialized during refactors.
  const session = useSessionContext?.();
  const selectedSessions = session?.selectedSessions ?? [];
  const removeSession = session?.removeSession ?? (() => {});
  const setDateRange = session?.setDateRange ?? (() => {});
  const clearAllSessions = session?.clearAllSessions ?? (() => {});

  // ✅ THE IMPORTANT ONE: never let this be undefined
  const dateRange = (session as any)?.dateRange ?? [null, null];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const locationParam = params.get("location");
    if (locationParam) {
      setFilters((prev) => ({ ...prev, locations: [locationParam] }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location]);

  const { data, isLoading, error } = useQuery<Camp[]>({
    queryKey: ["/api/camps"],
  });

  const camps = Array.isArray(data) ? data : [];

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
        const filterStart = parseISO(filters.dateStart);
        const filterEnd = parseISO(filters.dateEnd);
        const campStart = camp.seasonStart ? parseISO(camp.seasonStart) : null;
        const campEnd = camp.seasonEnd ? parseISO(camp.seasonEnd) : null;

        if (campStart && campEnd) {
          const overlaps = campStart <= filterEnd && campEnd >= filterStart;
          if (!overlaps) return false;
        }
      }

      if (filters.extendedHoursOnly && !camp.extendedHours) {
        return false;
      }

      if (filters.campSchedule.length > 0) {
        const campSchedule = camp.campSchedule ?? [];
        const hasSchedule = filters.campSchedule.some((schedule) =>
          campSchedule.includes(schedule),
        );
        if (!hasSchedule) return false;
      }

      if (filters.registrationStatus !== "all") {
        const regOpens = camp.registrationOpens ? parseISO(camp.registrationOpens) : null;
        const regCloses = camp.registrationCloses ? parseISO(camp.registrationCloses) : null;

        if (filters.registrationStatus === "open") {
          if (!regOpens || !regCloses) return false;
          if (isFuture(regOpens) || isPast(regCloses)) return false;
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
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "registration":
        default: {
          const aDate = a.registrationOpens ? parseISO(a.registrationOpens).getTime() : Number.POSITIVE_INFINITY;
          const bDate = b.registrationOpens ? parseISO(b.registrationOpens).getTime() : Number.POSITIVE_INFINITY;
          return aDate - bDate;
        }
      }
    });

    return sorted;
  }, [filteredCamps, sortBy]);

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
