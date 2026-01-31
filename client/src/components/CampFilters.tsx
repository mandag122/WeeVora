import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { FilterState } from "@shared/schema";
import { campCategories, campScheduleOptions } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";

interface CampFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  locations: string[];
  onClearFilters: () => void;
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
    filters.priceMin !== null || filters.priceMax !== null,
    filters.registrationStatus !== "all",
    filters.extendedHoursOnly,
    filters.campSchedule.length > 0
  ].filter(Boolean).length;

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
        <Label className="text-sm font-medium text-foreground">Categories</Label>
        <div className="space-y-2">
          {campCategories.map((category) => (
            <div key={category} className="flex items-center gap-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={(checked) => {
                  const newCategories = checked
                    ? [...filters.categories, category]
                    : filters.categories.filter((c) => c !== category);
                  onFilterChange({ categories: newCategories });
                }}
                data-testid={`checkbox-category-${category}`}
              />
              <Label 
                htmlFor={`category-${category}`}
                className="text-sm text-foreground/80 cursor-pointer"
              >
                {category}
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
        <Label className="text-sm font-medium text-foreground">
          Age Range: {filters.ageMin ?? 0} - {filters.ageMax ?? 18}
        </Label>
        <Slider
          value={[filters.ageMin ?? 0, filters.ageMax ?? 18]}
          min={0}
          max={18}
          step={1}
          onValueChange={([min, max]) => onFilterChange({ ageMin: min, ageMax: max })}
          className="mt-2"
          data-testid="slider-age"
        />
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
                {option}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CampFilters(props: CampFiltersProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search camps..."
              value={props.filters.search}
              onChange={(e) => props.onFilterChange({ search: e.target.value })}
              className="pl-10 rounded-full border-border/50"
              data-testid="input-search-mobile"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="shrink-0 rounded-full"
                data-testid="button-open-filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="bottom" 
              className="h-[85vh] rounded-t-3xl"
              style={{ overscrollBehavior: "contain" }}
            >
              <SheetHeader>
                <SheetTitle className="text-eggplant">Filter Camps</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-full pb-8 mt-4">
                <FilterContent {...props} />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </>
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
