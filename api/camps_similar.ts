/**
 * Vercel handler for GET /api/camps_similar?slug=:slug
 * Self-contained (no shared imports) so Vercel bundles it reliably.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
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
    const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } });
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
  const limit = Math.min(4, 20);
  try {
    const camps = await getCamps();
    const camp = camps.find((c) => (c.slug as string) === slug) ?? null;
    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }
    const similar = camps
      .filter((c) => c.id !== camp.id)
      .filter((c) => {
        const catA = (c.categories as string[]) || [];
        const catB = (camp.categories as string[]) || [];
        const hasOverlappingCategory = catA.some((cat: string) => catB.includes(cat));
        const cMin = c.ageMin as number | null;
        const cMax = c.ageMax as number | null;
        const campMin = camp.ageMin as number | null;
        const campMax = camp.ageMax as number | null;
        const hasOverlappingAge =
          cMin != null &&
          cMax != null &&
          campMin != null &&
          campMax != null &&
          cMin <= (campMax ?? 18) &&
          cMax >= (campMin ?? 0);
        return hasOverlappingCategory || hasOverlappingAge;
      })
      .sort((a, b) => {
        const aHasReg = !!(a.registrationOpens as string) || !!(a.registrationCloses as string);
        const bHasReg = !!(b.registrationOpens as string) || !!(b.registrationCloses as string);
        if (aHasReg && !bHasReg) return -1;
        if (!aHasReg && bHasReg) return 1;
        return 0;
      })
      .slice(0, limit);
    return res.status(200).json(similar);
  } catch (e) {
    console.error("Camps similar API error:", e);
    return res.status(500).json({ error: "Failed to fetch similar camps", message: (e as Error)?.message ?? String(e) });
  }
}
