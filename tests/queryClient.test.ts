import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { ApiError, getQueryFn } from "../src/lib/queryClient.js";

const realFetch = globalThis.fetch;

function stubFetch(status: number, body: unknown) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
}

async function run(queryKey: readonly unknown[]): Promise<unknown> {
  return getQueryFn<unknown>({ on401: "throw" })({ queryKey } as unknown as QueryFunctionContext);
}

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

test("a failing camps list surfaces the server's message instead of an empty list", async () => {
  stubFetch(503, { error: "Airtable rejected AIRTABLE_API_KEY", code: "unauthorized" });

  const error = await captureError(run(["/api/camps"]));

  if (!(error instanceof ApiError)) assert.fail("camps list failures must reach the UI as errors");
  assert.equal(error.status, 503);
  assert.match(error.message, /Airtable rejected AIRTABLE_API_KEY/);
});

test("a missing camp keeps its 404 so the detail page can say 'not found'", async () => {
  stubFetch(404, { error: "Camp not found" });

  const error = await captureError(run(["/api/camps", "no-such-camp"]));

  if (!(error instanceof ApiError)) assert.fail("expected the 404 to be preserved");
  assert.equal(error.status, 404);
});

test("supplementary queries still degrade quietly", async () => {
  stubFetch(503, { error: "Airtable unavailable" });

  assert.deepEqual(await run(["/api/camps", "some-camp", "similar"]), []);
  assert.deepEqual(await run(["/api/camp-ids-with-option-name"]), []);
});

test("a successful camps list is passed through", async () => {
  stubFetch(200, [{ id: "rec1", slug: "first-camp" }]);

  assert.deepEqual(await run(["/api/camps"]), [{ id: "rec1", slug: "first-camp" }]);
});
