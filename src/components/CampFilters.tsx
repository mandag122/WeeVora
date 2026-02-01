import { useState, useRef } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { FilterState } from "@shared/schema";
import { campInterests, interestColors, campScheduleOptions, scheduleAvailabilityLabels } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, addMonths, startOfMonth } from "date-fns";

const SUMMER_START = new Date(2026, 4, 1);
const SUMMER_END = new Date(2026, 8, 30);
const TOTAL_DAYS = Math.ceil((SUMMER_END.getTime() - SUMMER_START.getTime()) / (1000 * 60 * 60 * 24));

function dayToDate(day: number): Date {
  return new Date(SUMMER_START.getTime() + day * 24 * 60 * 60 * 1000);
}

function dateToDay(date: Date): number {
  return Math.ceil((date.getTime() - SUMMER_START.getTime()) / (1000 * 60 * 60 * 24));
}

interface CampFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  locations: string[];
  onClearFilters: () => void;
  /** Number of camps matching current filters (mobile: used for "See X results" CTA) */
  resultCount?: number;
}

function FilterContent({ 
  filters, 
  onFilterChange, 
  locations, 
  onClearFilters 
}: CampFiltersProps) {
  const activeFilterCount = [
    filters.search,
    filters.categories.length > 0,
    filters.locations.length > 0,
    filters.ageMin !== null || filters.ageMax !== null,
    filters.dateStart !== null || filters.dateEnd !== null,
    filters.registrationStatus !== "all",
    filters.extendedHoursOnly,
    filters.campSchedule.length > 0
  ].filter(Boolean).length;

  const dateSliderValue = [
    filters.dateStart ? dateToDay(new Date(filters.dateStart)) : 0,
    filters.dateEnd ? dateToDay(new Date(filters.dateEnd)) : TOTAL_DAYS
  ];

  const handleDateChange = ([start, end]: number[]) => {
    const startDate = dayToDate(start);
    const endDate = dayToDate(end);
    onFilterChange({ 
      dateStart: format(startDate, "yyyy-MM-dd"),
      dateEnd: format(endDate, "yyyy-MM-dd")
    });
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search camps..."
          value={filters.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          className="pl-10 rounded-full border-border/50 focus:border-eggplant"
          data-testid="input-search"
        />
      </div>

      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-eggplant/10 text-eggplant">
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-clear-filters"
          >
            <X className="w-4 h-4 mr-1" />
            Clear all
          </Button>
        </div>
      )}

      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">Registration Status</Label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all" as const, label: "All" },
            { value: "open" as const, label: "Open Now" },
            { value: "upcoming" as const, label: "Coming Soon" }
          ].map((option) => (
            <Button
              key={option.value}
              variant={filters.registrationStatus === option.value ? "default" : "outline"}
              size="sm"
              className={`rounded-full ${
                filters.registrationStatus === option.value 
                  ? "bg-eggplant hover:bg-eggplant-light" 
                  : "border-border/50 hover:border-eggplant hover:text-eggplant"
              }`}
              onClick={() => onFilterChange({ registrationStatus: option.value })}
              data-testid={`button-status-${option.value}`}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          Child's Age: {(filters.ageMin !== null || filters.ageMax !== null) 
            ? `${filters.ageMin ?? 3} - ${filters.ageMax ?? 18} years` 
            : "Any age (3-18)"}
        </Label>
        <Slider
          value={[filters.ageMin ?? 3, filters.ageMax ?? 18]}
          min={3}
          max={18}
          step={1}
          onValueChange={([min, max]) => onFilterChange({ ageMin: min, ageMax: max })}
          className="mt-2"
          data-testid="slider-age"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>3 yrs</span>
          <span>18 yrs</span>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          Camp Dates: {format(dayToDate(dateSliderValue[0]), "MMM d")} - {format(dayToDate(dateSliderValue[1]), "MMM d")}
        </Label>
        <Slider
          value={dateSliderValue}
          min={0}
          max={TOTAL_DAYS}
          step={1}
          onValueChange={handleDateChange}
          className="mt-2"
          data-testid="slider-dates"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>May 1</span>
          <span>Sep 30</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="extended-hours"
          checked={filters.extendedHoursOnly}
          onCheckedChange={(checked) => onFilterChange({ extendedHoursOnly: !!checked })}
          data-testid="checkbox-extended-hours"
        />
        <Label 
          htmlFor="extended-hours"
          className="text-sm text-foreground/80 cursor-pointer"
        >
          Extended hours available
        </Label>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">Schedule Availability</Label>
        <div className="space-y-2">
          {campScheduleOptions.map((option) => (
            <div key={option} className="flex items-center gap-2">
              <Checkbox
                id={`schedule-${option}`}
                checked={filters.campSchedule.includes(option)}
                onCheckedChange={(checked) => {
                  const newSchedule = checked
                    ? [...filters.campSchedule, option]
                    : filters.campSchedule.filter((s) => s !== option);
                  onFilterChange({ campSchedule: newSchedule });
                }}
                data-testid={`checkbox-schedule-${option}`}
              />
              <Label 
                htmlFor={`schedule-${option}`}
                className="text-sm text-foreground/80 cursor-pointer"
              >
                {scheduleAvailabilityLabels[option]}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {locations.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">Location</Label>
          <div className="space-y-2">
            {locations.map((location) => (
              <div key={location} className="flex items-center gap-2">
                <Checkbox
                  id={`location-${location}`}
                  checked={filters.locations.includes(location)}
                  onCheckedChange={(checked) => {
                    const newLocations = checked
                      ? [...filters.locations, location]
                      : filters.locations.filter((l) => l !== location);
                    onFilterChange({ locations: newLocations });
                  }}
                  data-testid={`checkbox-location-${location}`}
                />
                <Label 
                  htmlFor={`location-${location}`}
                  className="text-sm text-foreground/80 cursor-pointer"
                >
                  {location}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">Interests</Label>
        <div className="space-y-2">
          {campInterests.map((interest) => (
            <div key={interest} className="flex items-center gap-2">
              <Checkbox
                id={`interest-${interest}`}
                checked={filters.categories.includes(interest)}
                onCheckedChange={(checked) => {
                  const newInterests = checked
                    ? [...filters.categories, interest]
                    : filters.categories.filter((c) => c !== interest);
                  onFilterChange({ categories: newInterests });
                }}
                data-testid={`checkbox-interest-${interest}`}
              />
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: interestColors[interest] }}
              />
              <Label 
                htmlFor={`interest-${interest}`}
                className="text-sm text-foreground/80 cursor-pointer"
              >
                {interest}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mobile-only: filter sections in accordion + sticky "See X results" CTA */
function MobileFilterSheetContent({
  filters,
  onFilterChange,
  locations,
  onClearFilters,
  resultCount = 0,
  onCloseSheet,
}: CampFiltersProps & { onCloseSheet: () => void }) {
  const activeFilterCount = [
    filters.search,
    filters.categories.length > 0,
    filters.locations.length > 0,
    filters.ageMin !== null || filters.ageMax !== null,
    filters.dateStart !== null || filters.dateEnd !== null,
    filters.registrationStatus !== "all",
    filters.extendedHoursOnly,
    filters.campSchedule.length > 0
  ].filter(Boolean).length;

  const dateSliderValue = [
    filters.dateStart ? dateToDay(new Date(filters.dateStart)) : 0,
    filters.dateEnd ? dateToDay(new Date(filters.dateEnd)) : TOTAL_DAYS
  ];

  const handleDateChange = ([start, end]: number[]) => {
    const startDate = dayToDate(start);
    const endDate = dayToDate(end);
    onFilterChange({
      dateStart: format(startDate, "yyyy-MM-dd"),
      dateEnd: format(endDate, "yyyy-MM-dd")
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 space-y-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search camps..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-10 rounded-full border-border/50 focus:border-eggplant"
            data-testid="input-search-sheet"
          />
        </div>
        {activeFilterCount > 0 && (
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-eggplant/10 text-eggplant">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-clear-filters-sheet"
            >
              <X className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
        <Accordion type="multiple" defaultValue={[]} className="w-full">
          <AccordionItem value="registration" className="border-b border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground py-3 hover:no-underline">
              Registration Status
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all" as const, label: "All" },
                  { value: "open" as const, label: "Open Now" },
                  { value: "upcoming" as const, label: "Coming Soon" }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={filters.registrationStatus === option.value ? "default" : "outline"}
                    size="sm"
                    className={`rounded-full ${
                      filters.registrationStatus === option.value
                        ? "bg-eggplant hover:bg-eggplant-light"
                        : "border-border/50 hover:border-eggplant hover:text-eggplant"
                    }`}
                    onClick={() => onFilterChange({ registrationStatus: option.value })}
                    data-testid={`button-status-${option.value}-sheet`}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="age" className="border-b border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground py-3 hover:no-underline">
              Child&apos;s Age: {(filters.ageMin !== null || filters.ageMax !== null)
                ? `${filters.ageMin ?? 3} - ${filters.ageMax ?? 18} years`
                : "Any age (3-18)"}
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <Slider
                value={[filters.ageMin ?? 3, filters.ageMax ?? 18]}
                min={3}
                max={18}
                step={1}
                onValueChange={([min, max]) => onFilterChange({ ageMin: min, ageMax: max })}
                className="mt-2"
                data-testid="slider-age-sheet"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>3 yrs</span>
                <span>18 yrs</span>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="dates" className="border-b border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground py-3 hover:no-underline">
              Camp Dates: {format(dayToDate(dateSliderValue[0]), "MMM d")} - {format(dayToDate(dateSliderValue[1]), "MMM d")}
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <Slider
                value={dateSliderValue}
                min={0}
                max={TOTAL_DAYS}
                step={1}
                onValueChange={handleDateChange}
                className="mt-2"
                data-testid="slider-dates-sheet"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>May 1</span>
                <span>Sep 30</span>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="extended" className="border-b border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground py-3 hover:no-underline">
              Extended hours
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="extended-hours-sheet"
                  checked={filters.extendedHoursOnly}
                  onCheckedChange={(checked) => onFilterChange({ extendedHoursOnly: !!checked })}
                  data-testid="checkbox-extended-hours-sheet"
                />
                <Label htmlFor="extended-hours-sheet" className="text-sm text-foreground/80 cursor-pointer">
                  Extended hours available
                </Label>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="schedule" className="border-b border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground py-3 hover:no-underline">
              Schedule Availability
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-2">
                {campScheduleOptions.map((option) => (
                  <div key={option} className="flex items-center gap-2">
                    <Checkbox
                      id={`schedule-sheet-${option}`}
                      checked={filters.campSchedule.includes(option)}
                      onCheckedChange={(checked) => {
                        const newSchedule = checked
                          ? [...filters.campSchedule, option]
                          : filters.campSchedule.filter((s) => s !== option);
                        onFilterChange({ campSchedule: newSchedule });
                      }}
                      data-testid={`checkbox-schedule-sheet-${option}`}
                    />
                    <Label htmlFor={`schedule-sheet-${option}`} className="text-sm text-foreground/80 cursor-pointer">
                      {scheduleAvailabilityLabels[option]}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {locations.length > 0 && (
            <AccordionItem value="location" className="border-b border-border">
              <AccordionTrigger className="text-sm font-medium text-foreground py-3 hover:no-underline">
                Location
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-2">
                  {locations.map((location) => (
                    <div key={location} className="flex items-center gap-2">
                      <Checkbox
                        id={`location-sheet-${location}`}
                        checked={filters.locations.includes(location)}
                        onCheckedChange={(checked) => {
                          const newLocations = checked
                            ? [...filters.locations, location]
                            : filters.locations.filter((l) => l !== location);
                          onFilterChange({ locations: newLocations });
                        }}
                        data-testid={`checkbox-location-sheet-${location}`}
                      />
                      <Label htmlFor={`location-sheet-${location}`} className="text-sm text-foreground/80 cursor-pointer">
                        {location}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="interests" className="border-b border-border">
            <AccordionTrigger className="text-sm font-medium text-foreground py-3 hover:no-underline">
              Interests
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-2">
                {campInterests.map((interest) => (
                  <div key={interest} className="flex items-center gap-2">
                    <Checkbox
                      id={`interest-sheet-${interest}`}
                      checked={filters.categories.includes(interest)}
                      onCheckedChange={(checked) => {
                        const newInterests = checked
                          ? [...filters.categories, interest]
                          : filters.categories.filter((c) => c !== interest);
                        onFilterChange({ categories: newInterests });
                      }}
                      data-testid={`checkbox-interest-sheet-${interest}`}
                    />
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: interestColors[interest] }}
                    />
                    <Label htmlFor={`interest-sheet-${interest}`} className="text-sm text-foreground/80 cursor-pointer">
                      {interest}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>

      <div className="flex-shrink-0 pt-4 pb-2 border-t border-border bg-background">
        <Button
          className="w-full rounded-full h-12 text-base font-semibold bg-eggplant hover:bg-eggplant-light text-white"
          onClick={onCloseSheet}
          data-testid="button-see-results"
        >
          See {resultCount} result{resultCount !== 1 ? "s" : ""}
        </Button>
      </div>
    </div>
  );
}

export function CampFilters(props: CampFiltersProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileFilterBar {...props} />
    );
  }

  return (
    <aside 
      className="w-72 shrink-0 bg-white rounded-lg border border-border/50 shadow-paper sticky top-24 max-h-[calc(100vh-7rem)] flex flex-col"
      data-testid="sidebar-filters"
    >
      <h2 className="font-semibold text-lg text-eggplant p-5 pb-0 mb-4">Filters</h2>
      <div className="overflow-y-auto flex-1 px-5 pb-5">
        <FilterContent {...props} />
      </div>
    </aside>
  );
}

function MobileFilterBar(props: CampFiltersProps) {
  const [searchActive, setSearchActive] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSearchBarClick = () => {
    if (!searchActive) {
      setSearchActive(true);
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  };

  const resultCount = props.resultCount ?? 0;

  return (
    <>
      <div className="flex gap-2 mb-4 min-w-0 w-full">
        <div
          className="relative flex-1 min-w-0 overflow-hidden rounded-full"
          onClick={handleSearchBarClick}
          role="button"
          tabIndex={0}
          aria-label="Search camps"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            ref={searchRef}
            type="search"
            placeholder="Search camps..."
            value={props.filters.search}
            onChange={(e) => props.onFilterChange({ search: e.target.value })}
            readOnly={!searchActive}
            className="pl-10 rounded-full border-border/50 min-w-0 w-full max-w-full focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-offset-0 focus-visible:ring-eggplant/30"
            data-testid="input-search-mobile"
          />
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              className="shrink-0 rounded-full border-2 border-eggplant bg-eggplant/15 text-eggplant hover:bg-eggplant/25 hover:text-eggplant"
              data-testid="button-open-filters"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="bottom" 
            className="h-[85vh] rounded-t-3xl flex flex-col p-6"
            style={{ overscrollBehavior: "contain" }}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <SheetHeader className="flex-shrink-0">
              <SheetTitle className="text-eggplant">Filter Camps</SheetTitle>
            </SheetHeader>
            <div className="flex-1 min-h-0 flex flex-col mt-4">
              <MobileFilterSheetContent
                {...props}
                resultCount={resultCount}
                onCloseSheet={() => setSheetOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
