/**
 * Returns camp IDs that have at least one Registration_Options row with option_name filled.
 * Used by the frontend for "Most detail first" sort so we don't rely on camp.hasRegistrationDetail.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

function getCampIdFromLink(fields: Record<string, unknown>): string {
  for (const key of ["Camps", "Camps 2", "Camp"]) {
    const raw = (fields[key] as unknown[])?.[0];
    if (typeof raw === "string") return raw;
    if (raw && typeof raw === "object" && "id" in raw) return (raw as { id: string }).id ?? "";
  }
  return "";
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const key = process.env.AIRTABLE_API_KEY;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!key || !base) {
    return res.status(500).json({ error: "Missing env vars" });
  }
  try {
    const allRecords: AirtableRecord[] = [];
    let offset: string | undefined;
    do {
      const url = new URL(`https://api.airtable.com/v0/${base}/Registration_Options`);
      if (offset) url.searchParams.set("offset", offset);
      const r = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      });
      if (!r.ok) return res.status(502).json({ error: "Airtable error" });
      const data = (await r.json()) as { records?: AirtableRecord[]; offset?: string };
      allRecords.push(...(data.records || []));
      offset = data.offset;
    } while (offset);

    const ids = new Set<string>();
    for (const rec of allRecords) {
      const fields = rec.fields || {};
      const campId = getCampIdFromLink(fields);
      const optionName = String(fields.option_name ?? fields["Option Name"] ?? "").trim();
      if (campId && optionName) ids.add(campId);
    }
    return res.status(200).json(Array.from(ids));
  } catch (e) {
    console.error("camp-ids-with-option-name error:", e);
    return res.status(500).json({ error: (e as Error)?.message ?? "Failed" });
  }
}
