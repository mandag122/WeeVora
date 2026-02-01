import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
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
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      if (queryKey[0] === "/api/camps" && queryKey.length === 1) {
        console.warn(`Camps API failed (${res.status}), showing empty list:`, text.slice(0, 100));
        return [] as never;
      }
      if (queryKey[0] === "/api/camps" && queryKey.length === 2) {
        console.warn(`Camp detail API failed (${res.status}), skipping:`, text.slice(0, 80));
        return null as never;
      }
      if (queryKey[0] === "/api/camps" && queryKey.length >= 3) {
        console.warn(`Camp sessions/similar API failed (${res.status}), showing empty:`, text.slice(0, 80));
        return [] as never;
      }
      throw new Error(`${res.status}: ${text}`);
    }

    const json = await res.json();
    if (queryKey[0] === "/api/camps" && queryKey.length === 1 && !Array.isArray(json)) {
      console.warn("Camps API returned non-array, showing empty list");
      return [] as never;
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
