/**
 * GET /api/health            → liveness plus the Airtable credential state.
 * GET /api/health?airtable=1 → also does one live read against Airtable, which is the fastest way
 *                              to confirm a rotated key actually reached this deployment.
 *
 * The Airtable module is imported lazily and inside a try/catch: a health endpoint that dies the
 * same way as the endpoints it is meant to diagnose tells you nothing. If loading it fails, that
 * is reported as JSON instead of taking the function down with it.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  const runtime = {
    time: new Date().toISOString(),
    runtime: process.version,
    region: process.env.VERCEL_REGION ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
  };

  let airtableModule: typeof import("./_lib/airtable");
  try {
    airtableModule = await import("./_lib/airtable");
  } catch (error) {
    return res.status(500).json({
      ok: false,
      ...runtime,
      error: `Could not load the Airtable module: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  const wantsLiveCheck = req.query.airtable === "1" || req.query.airtable === "true";
  if (!wantsLiveCheck) {
    return res.status(200).json({ ok: true, ...runtime, airtable: airtableModule.describeAirtableConfig() });
  }

  const airtable = await airtableModule.checkAirtableConnection();
  return res.status(airtable.ok ? 200 : 503).json({ ok: airtable.ok, ...runtime, airtable });
}
