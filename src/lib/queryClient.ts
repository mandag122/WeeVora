import { QueryClient, QueryFunction } from "@tanstack/react-query";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(`${status}: ${message}`);
    this.name = "ApiError";
    this.status = status;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    throw new ApiError(res.status, await readErrorMessage(res));
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
function buildApiUrl(queryKey: readonly unknown[]): string {
  // Camp list: ["/api/camps"] -> /api/camps
  if (queryKey[0] === "/api/camps" && queryKey.length === 1) {
    return "/api/camps";
  }
  // Camp IDs with option_name (for sort): ["/api/camp-ids-with-option-name"] -> /api/camp-ids-with-option-name
  if (queryKey[0] === "/api/camp-ids-with-option-name") {
    return "/api/camp-ids-with-option-name";
  }
  // Camp by slug: ["/api/camps", slug] -> /api/camps_slug?slug=...
  if (queryKey[0] === "/api/camps" && queryKey.length === 2 && typeof queryKey[1] === "string") {
    return `/api/camps_slug?slug=${encodeURIComponent(queryKey[1])}`;
  }
  // Sessions: ["/api/camps", slug, "sessions"] -> /api/camps_sessions?slug=...
  if (queryKey[0] === "/api/camps" && queryKey.length === 3 && queryKey[2] === "sessions" && typeof queryKey[1] === "string") {
    return `/api/camps_sessions?slug=${encodeURIComponent(queryKey[1])}`;
  }
  // Similar: ["/api/camps", slug, "similar"] -> /api/camps_similar?slug=...
  if (queryKey[0] === "/api/camps" && queryKey.length === 3 && queryKey[2] === "similar" && typeof queryKey[1] === "string") {
    return `/api/camps_similar?slug=${encodeURIComponent(queryKey[1])}`;
  }
  return queryKey.join("/") as string;
}

/**
 * Queries whose failure only costs a nicety (sort order, "similar camps" strip) and can be
 * degraded to an empty list. Everything else must surface, so a backend outage shows up as an
 * error state instead of an empty catalogue that looks like a working site with no camps.
 */
function isOptionalQuery(queryKey: readonly unknown[]): boolean {
  if (queryKey[0] === "/api/camp-ids-with-option-name") return true;
  return queryKey[0] === "/api/camps" && queryKey.length === 3 && queryKey[2] === "similar";
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = (await res.text().catch(() => "")) || res.statusText;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.error === "string") return parsed.error;
  } catch {
    // Not JSON (HTML error page, plain text from a proxy, ...) - fall through to the raw body.
  }
  return text;
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = buildApiUrl(queryKey);
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      const message = await readErrorMessage(res);
      if (isOptionalQuery(queryKey)) {
        console.warn(`${url} failed (${res.status}), continuing without it:`, message.slice(0, 200));
        return [] as never;
      }
      throw new ApiError(res.status, message);
    }

    const json = await res.json();
    if (isOptionalQuery(queryKey) && !Array.isArray(json)) {
      console.warn(`${url} returned a non-array, continuing without it`);
      return [] as never;
    }
    if (queryKey[0] === "/api/camps" && queryKey.length === 1 && !Array.isArray(json)) {
      throw new Error(`${url} returned ${typeof json} instead of a list of camps`);
    }
    return json;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
