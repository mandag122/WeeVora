/**
 * The narrowest possible function: no imports, no environment access, no I/O.
 *
 * If this returns 500 while the static site is fine, the failure is the deployment or its runtime
 * rather than anything in our code, because there is nothing here left to fail. The reported
 * runtime version is what the deployed functions are actually executing on.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.status(200).json({
    ok: true,
    time: new Date().toISOString(),
    runtime: process.version,
    region: process.env.VERCEL_REGION ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  });
}
