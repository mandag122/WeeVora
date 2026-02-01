/**
 * Vercel handler for GET /api/camps_sessions?slug=:slug
 * Self-contained (no shared imports) so Vercel bundles it reliably.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface RegistrationOptionResponse {
  id: string;
  campId: string;
  sessionName: string;
  startDate: string | null;
  endDate: string | null;
  price: number | null;
  extendedPrice: number | null;
  ageMin: number | null;
  ageMax: number | null;
  registrationOpens: string | null;
  registrationCloses: string | null;
  waitlistOnly: boolean;
  color: string | null;
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

async function fetchRegistrationOptions(): Promise<RegistrationOptionResponse[]> {
  const key = process.env.AIRTABLE_API_KEY;
  const base = process.env.AIRTABLE_BASE_ID;
  const table = "Registration_Options";
  if (!key || !base) return [];

  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`);
    if (offset) url.searchParams.set("offset", offset);
    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    });
    if (!r.ok) return [];
    const data = (await r.json()) as { records?: AirtableRecord[]; offset?: string };
    allRecords.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  const results: RegistrationOptionResponse[] = [];
  for (const record of allRecords) {
    const campId = (record.fields?.Camps as string[])?.[0] ?? "";
    const optionNames = ((record.fields?.option_name as string) ?? "Session").split(",").map((s) => s.trim());
    const datesCsv = ((record.fields?.dates_csv as string) ?? "").split(",").map((s) => s.trim());
    const prices = ((record.fields?.price as string) ?? "").split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
    const extendedPrices = ((record.fields?.ex_hours_price as string) ?? "").split(",").map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
    optionNames.forEach((name, idx) => {
      const dateRange = datesCsv[idx] ?? "";
      const [startStr, endStr] = dateRange.split("-").map((s) => s.trim());
      let startDate: string | null = null;
      let endDate: string | null = null;
      if (startStr) {
        const [month, day, year] = startStr.split("/");
        if (month && day && year) startDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      if (endStr) {
        const [month, day, year] = endStr.split("/");
        if (month && day && year) endDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      results.push({
        id: `${record.id}-${idx}`,
        campId,
        sessionName: name || `Session ${idx + 1}`,
        startDate,
        endDate,
        price: prices[idx] ?? null,
        extendedPrice: extendedPrices[idx] ?? null,
        ageMin: (record.fields?.age_min as number) ?? null,
        ageMax: (record.fields?.age_max as number) ?? null,
        registrationOpens: (record.fields?.registration_opens as string) ?? null,
        registrationCloses: (record.fields?.registration_closes as string) ?? null,
        waitlistOnly: !!(record.fields?.waitlist_only as boolean),
        color: (record.fields?.color as string) ?? null,
      });
    });
  }
  return results;
}

function generateSlug(name: string, id: string): string {
  const baseSlug = (name || "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
  return baseSlug || id;
}
function parseAgeGroup(ageGroup: string | undefined): { min: number | null; max: number | null } {
  if (!ageGroup) return { min: null, max: null };
  const match = ageGroup.match(/(\d+)\s*-\s*(\d+)/);
  if (match) return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
  const single = ageGroup.match(/(\d+)\+?/);
  if (single) return { min: parseInt(single[1], 10), max: null };
  return { min: null, max: null };
}
async function getCamps(): Promise<{ id: string; slug: string }[]> {
  const key = process.env.AIRTABLE_API_KEY;
  const base = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE_NAME || "Camps";
  if (!key || !base) return [];
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`);
    if (offset) url.searchParams.set("offset", offset);
    const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } });
    if (!r.ok) return [];
    const data = (await r.json()) as { records?: AirtableRecord[]; offset?: string };
    allRecords.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  const ages = allRecords.map((r) => parseAgeGroup(r.fields?.["Age Group"] as string | undefined));
  return allRecords.map((record, index) => {
    const fields = record.fields || {};
    const age = ages[index] ?? { min: null, max: null };
    const name = (fields["Camp Name"] as string) || "Unnamed Camp";
    return { id: record.id, slug: generateSlug(name, record.id) };
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const slug = (req.query.slug as string) ?? "";
  if (!slug) {
    return res.status(400).json({ error: "Missing slug" });
  }
  try {
    const camps = await getCamps();
    const camp = camps.find((c) => c.slug === slug) ?? null;
    if (!camp) return res.status(404).json({ error: "Camp not found" });
    const allOptions = await fetchRegistrationOptions();
    const sessions = allOptions.filter((s) => s.campId === camp.id);
    return res.status(200).json(sessions);
  } catch (e) {
    console.error("Camps sessions API error:", e);
    return res.status(500).json({ error: "Failed to fetch sessions", message: (e as Error)?.message ?? String(e) });
  }
}
