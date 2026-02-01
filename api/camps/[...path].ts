/**
 * Vercel catch-all for /api/camps/:slug, /api/camps/:slug/sessions, /api/camps/:slug/similar.
 * Vercel often doesn't create separate functions for [slug] in subfolders; this ensures all work.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCamps } from "./index";

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
    const prices = ((record.fields?.price as string) ?? "")
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
    const extendedPrices = ((record.fields?.ex_hours_price as string) ?? "")
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

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

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pathRaw = req.query.path;
  const pathSegments = Array.isArray(pathRaw) ? pathRaw : pathRaw ? [pathRaw] : [];
  if (pathSegments.length === 0) {
    return res.status(404).json({ error: "Not found" });
  }

  const slug = pathSegments[0];
  const sub = pathSegments[1];

  try {
    const camps = await getCamps();
    const camp = camps.find((c) => c.slug === slug) ?? null;

    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    // /api/camps/:slug → single camp
    if (pathSegments.length === 1) {
      return res.status(200).json(camp);
    }

    // /api/camps/:slug/sessions
    if (pathSegments.length === 2 && sub === "sessions") {
      const allOptions = await fetchRegistrationOptions();
      const sessions = allOptions.filter((s) => s.campId === camp.id);
      return res.status(200).json(sessions);
    }

    // /api/camps/:slug/similar
    if (pathSegments.length === 2 && sub === "similar") {
      const limit = Math.min(4, 20);
      const similar = camps
        .filter((c) => c.id !== camp.id)
        .filter((c) => {
          const hasOverlappingCategory = c.categories.some((cat) => camp.categories.includes(cat));
          const hasOverlappingAge =
            c.ageMin != null &&
            c.ageMax != null &&
            camp.ageMin != null &&
            camp.ageMax != null &&
            c.ageMin <= (camp.ageMax ?? 18) &&
            c.ageMax >= (camp.ageMin ?? 0);
          return hasOverlappingCategory || hasOverlappingAge;
        })
        .sort((a, b) => {
          const aHasReg = !!a.registrationOpens || !!a.registrationCloses;
          const bHasReg = !!b.registrationOpens || !!b.registrationCloses;
          if (aHasReg && !bHasReg) return -1;
          if (!aHasReg && bHasReg) return 1;
          return 0;
        })
        .slice(0, limit);
      return res.status(200).json(similar);
    }

    return res.status(404).json({ error: "Not found" });
  } catch (e) {
    console.error("Camps catch-all API error:", e);
    return res.status(500).json({
      error: "Failed",
      message: (e as Error)?.message ?? String(e),
    });
  }
}
