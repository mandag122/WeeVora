import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionContext } from "@/context/SessionContext";
import { trackCalendarOpened } from "@/lib/analytics";

/**
 * Mobile-only sticky circular FAB that opens the calendar dialog.
 * Shown on camp search (/camps) and camp detail (/camps/:slug) views.
 */
export function MobileCalendarFAB() {
  const sessionContext = useSessionContext();
  const setCalendarOpen = sessionContext?.setCalendarOpen;

  if (!setCalendarOpen) return null;

  const handleClick = () => {
    trackCalendarOpened();
    setCalendarOpen(true);
  };

  return (
    <Button
      type="button"
      aria-label="View calendar"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-eggplant hover:bg-eggplant-light text-white shadow-lg p-0 md:hidden"
      onClick={handleClick}
      data-testid="button-mobile-calendar-fab"
    >
      <Calendar className="h-6 w-6" />
    </Button>
  );
}
