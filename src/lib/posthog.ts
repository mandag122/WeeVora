/**
 * PostHog init with session replay. Runs once on app load.
 * Set VITE_POSTHOG_KEY and VITE_POSTHOG_HOST in .env (and in Vercel env vars for production).
 */
import posthog from "posthog-js";

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const host = import.meta.env.VITE_POSTHOG_HOST as string | undefined;

if (key && host) {
  posthog.init(key, {
    api_host: host,
    person_profiles: "always",
    session_recording: {
      recordCrossOriginIframes: false,
    },
  });
}

export { posthog };
