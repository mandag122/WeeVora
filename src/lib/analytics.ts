/**
 * Google Analytics 4 event tracking. All click/interaction events go through here.
 * Events show up in GA4 under Reports → Engagement → Events (and can be used in explorations).
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function gtagEvent(eventName: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  // Always log so you can confirm tracking runs (remove or gate on NODE_ENV later)
  console.log("[WeeVora GA]", eventName, params ?? {});
  if (window.gtag) {
    window.gtag("event", eventName, params);
  } else {
    console.warn("[WeeVora GA] gtag not found – Google tag script may be blocked or not loaded.");
  }
}

/** User clicked a camp card (list or similar) → navigates to camp detail */
export function trackCampCardClick(options: {
  campId: string;
  campName: string;
  campSlug: string;
  source?: "list" | "similar";
}) {
  gtagEvent("camp_card_click", {
    camp_id: options.campId,
    camp_name: options.campName,
    camp_slug: options.campSlug,
    ...(options.source && { source: options.source }),
  });
}

/** User added a session to their calendar */
export function trackAddToCalendar(options: {
  campId: string;
  campName: string;
  sessionId: string;
  sessionName: string;
  isExtended: boolean;
}) {
  gtagEvent("add_to_calendar", {
    camp_id: options.campId,
    camp_name: options.campName,
    session_id: options.sessionId,
    session_name: options.sessionName,
    is_extended: options.isExtended,
  });
}

/** User opened the expanded calendar view (maximize/full view) */
export function trackCalendarOpened() {
  gtagEvent("calendar_opened");
}

/** User clicked "Register on Website" → opens camp's external site */
export function trackRegisterWebsiteClick(options: {
  campId: string;
  campName: string;
  url: string;
}) {
  gtagEvent("register_website_click", {
    camp_id: options.campId,
    camp_name: options.campName,
    link_url: options.url,
  });
}

/** User clicked "View Available Sessions" on camp detail → scrolls to sessions */
export function trackViewAvailableSessions(options: { campId: string; campName: string }) {
  gtagEvent("view_available_sessions", {
    camp_id: options.campId,
    camp_name: options.campName,
  });
}

/** User removed a session from the calendar (confirmed delete) */
export function trackSessionRemovedFromCalendar(options: {
  campId: string;
  campName: string;
  sessionId: string;
  sessionName: string;
}) {
  gtagEvent("session_removed_from_calendar", {
    camp_id: options.campId,
    camp_name: options.campName,
    session_id: options.sessionId,
    session_name: options.sessionName,
  });
}
