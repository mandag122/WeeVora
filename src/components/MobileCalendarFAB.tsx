import { createPortal } from "react-dom";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionContext } from "@/context/SessionContext";
import { trackCalendarOpened } from "@/lib/analytics";

/**
 * Mobile-only sticky circular FAB that opens the calendar dialog.
 * Shown on camp search (/camps) and camp detail (/camps/:slug) views.
 * Rendered in a portal so it is never clipped by parent overflow.
 */
export function MobileCalendarFAB() {
  const sessionContext = useSessionContext();
  const setCalendarOpen = sessionContext?.setCalendarOpen;

  const handleClick = () => {
    trackCalendarOpened();
    setCalendarOpen?.(true);
  };

  const fab = (
    <Button
      type="button"
      aria-label="View calendar"
      className="fixed bottom-6 right-6 z-[100] h-14 w-14 rounded-full bg-eggplant hover:bg-eggplant-light text-white shadow-lg p-0 border-0 lg:hidden"
      style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 100 }}
      onClick={handleClick}
      data-testid="button-mobile-calendar-fab"
    >
      <Calendar className="h-6 w-6" />
    </Button>
  );

  if (typeof document !== "undefined" && document.body) {
    return createPortal(fab, document.body);
  }
  return fab;
}
