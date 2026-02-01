/**
 * Vercel handler for GET /api/camps_slug?slug=:slug
 * Self-contained (no shared imports) so Vercel bundles it reliably.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
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

async function getCamps(): Promise<Record<string, unknown>[]> {
  const key = process.env.AIRTABLE_API_KEY;
  const base = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE_NAME || "Camps";
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

  const visible = allRecords.filter((r) => r.fields?.hide !== true && r.fields?.Hide !== true);
  const ages = visible.map((r) => parseAgeGroup(r.fields?.["Age Group"] as string | undefined));
  return visible.map((record, index) => {
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
    const camp = camps.find((c) => (c.slug as string) === slug) ?? null;
    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }
    return res.status(200).json(camp);
  } catch (e) {
    console.error("Camp slug API error:", e);
    return res.status(500).json({ error: "Failed to fetch camp", message: (e as Error)?.message ?? String(e) });
  }
}
