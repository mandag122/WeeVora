/**
 * GET /api/health            → liveness only.
 * GET /api/health?airtable=1 → also does one live read against Airtable, which is the fastest way
 *                              to confirm a rotated key actually reached this deployment.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { checkAirtableConnection, describeAirtableConfig } from "./_lib/airtable";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  const time = new Date().toISOString();
  const wantsLiveCheck = req.query.airtable === "1" || req.query.airtable === "true";

  if (!wantsLiveCheck) {
    return res.status(200).json({ ok: true, time, airtable: describeAirtableConfig() });
  }

  const airtable = await checkAirtableConnection();
  return res.status(airtable.ok ? 200 : 503).json({ ok: airtable.ok, time, airtable });
}
