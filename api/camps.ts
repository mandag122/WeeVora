/**
 * Vercel serverless handler for /api/camps.
 * Returns the same Camp[] shape as the Express server so the frontend works on weevora.com.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface CampResponse {
  id: string;
  name: string;
  slug: string;
  organization: string | null;
  description: string | null;
  categories: string[];
  ageMin: number | null;
  ageMax: number | null;
  locationCity: string | null;
  locationAddress: string | null;
  priceMin: number | null;
  priceMax: number | null;
  registrationOpens: string | null;
  registrationCloses: string | null;
  seasonStart: string | null;
  seasonEnd: string | null;
  campHours: string | null;
  extendedHours: boolean;
  extendedHoursInfo: string | null;
  waitlistOnly: boolean;
  siblingDiscountNote: string | null;
  websiteUrl: string | null;
  color: string | null;
  additionalInfo: string | null;
  campSchedule: string[];
}

function generateSlug(name: string, id: string): string {
  const baseSlug = (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
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

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const key = process.env.AIRTABLE_API_KEY;
    const base = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_TABLE_NAME || "Camps";

    if (!key || !base) {
      return res.status(500).json({ error: "Missing env vars", hasKey: Boolean(key), hasBase: Boolean(base) });
    }

    const allRecords: AirtableRecord[] = [];
    let offset: string | undefined;

    do {
      const url = new URL(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`);
      if (offset) url.searchParams.set("offset", offset);

      const r = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      });

      if (!r.ok) {
        const text = await r.text();
        console.error("Airtable API error:", r.status, text);
        return res.status(r.status).json({ error: "Airtable API error", status: r.status });
      }

      const data = (await r.json()) as { records?: AirtableRecord[]; offset?: string };
      allRecords.push(...(data.records || []));
      offset = data.offset;
    } while (offset);

    const ages = allRecords.map((r) => parseAgeGroup(r.fields?.["Age Group"] as string | undefined));

    const camps: CampResponse[] = allRecords.map((record, index) => {
      const fields = record.fields || {};
      const age = ages[index] ?? { min: null, max: null };
      const name = (fields["Camp Name"] as string) || "Unnamed Camp";
      return {
        id: record.id,
        name,
        slug: generateSlug(name, record.id),
        organization: (fields.Organization as string) || null,
        description: (fields.Description as string) || null,
        categories: Array.isArray(fields.Interests) ? (fields.Interests as string[]) : [],
        ageMin: age.min,
        ageMax: age.max,
        locationCity: (fields["Location City"] as string) || null,
        locationAddress: (fields.Location as string) || null,
        priceMin: (fields["Price Min"] as number) ?? null,
        priceMax: (fields["Price Max"] as number) ?? null,
        registrationOpens: (fields["Registration Opens"] as string) || null,
        registrationCloses: (fields["Registration Closes"] as string) || null,
        seasonStart: (fields["Start Date"] as string) || null,
        seasonEnd: (fields["End Date"] as string) || null,
        campHours: (fields.camp_hours as string) || null,
        extendedHours: !!(fields.ex_hours as string),
        extendedHoursInfo: (fields.ex_hours as string) || null,
        waitlistOnly: (fields["Waitlist Only"] as boolean) || false,
        siblingDiscountNote: (fields["Sibling Discount"] as string) || null,
        websiteUrl: (fields.Website as string) || null,
        color: (fields.Color as string) || null,
        additionalInfo: (fields["Additional Info"] as string) || null,
        campSchedule: Array.isArray(fields["Camp schedule"]) ? (fields["Camp schedule"] as string[]) : [],
      };
    });

    return res.status(200).json(camps);
  } catch (e) {
    console.error("Camps API error:", e);
    return res.status(500).json({
      error: "Handler crashed",
      message: (e as Error)?.message ?? String(e),
    });
  }
}
