function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseAgeRange(ageGroup: unknown): { ageMin: number | null; ageMax: number | null } {
  const s = String(ageGroup ?? "").trim();
  if (!s) return { ageMin: null, ageMax: null };

  // handles "12-14", "Ages 12 - 14", "12 – 14"
  const m = s.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) return { ageMin: Number(m[1]), ageMax: Number(m[2]) };

  // handles "12+" or "12"
  const single = s.match(/(\d+)/);
  if (single) return { ageMin: Number(single[1]), ageMax: null };

  return { ageMin: null, ageMax: null };
}

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "yes" || s === "1";
}

const camps = records.map((r: any) => {
  const f = r.fields ?? {};

  const name = String(f["Camp Name"] ?? "").trim();
  const { ageMin, ageMax } = parseAgeRange(f["Age Group"]);

  const categories = Array.isArray(f["Interests"]) ? f["Interests"] : [];

  const registrationOpens = f["Registration Opens"] ? String(f["Registration Opens"]) : null;

  // If you have a closes field in Airtable later, map it here:
  const registrationCloses = f["Registration Closes"] ? String(f["Registration Closes"]) : null;

  const seasonStart = f["Start Date"] ? String(f["Start Date"]) : null;
  const seasonEnd = f["End Date"] ? String(f["End Date"]) : null;

  const extendedHours = toBool(f["Extended Hours"]);
  const extendedHoursInfo =
    f["ex_hours"]
      ? String(f["ex_hours"])
      : f["Extended Hours Info"]
        ? String(f["Extended Hours Info"])
        : null;

  // Price: if you eventually add numeric fields, map them.
  // For now keep these null so UI doesn't display weird ranges.
  const priceMin = typeof f["Price Min"] === "number" ? f["Price Min"] : null;
  const priceMax = typeof f["Price Max"] === "number" ? f["Price Max"] : null;

  // "Is Registration Open?" is useful as a fallback if dates are missing
  // (but your CampCard logic uses dates; we keep dates as source of truth)
  const isRegistrationOpen = String(f["Is Registration Open?"] ?? "").toLowerCase() === "yes";

  return {
    id: f["camp_id"] ?? r.id,
    airtableId: r.id,

    name,
    slug: (f["slug"] ? String(f["slug"]) : slugify(name)) || r.id,

    organization: f["Organization"] ? String(f["Organization"]) : null,
    description: f["Description"] ? String(f["Description"]) : null,

    categories,

    location: f["Location"] ? String(f["Location"]) : null,
    locationCity: f["Location City"] ? String(f["Location City"]) : null,

    ageMin,
    ageMax,

    priceMin,
    priceMax,

    campHours: f["camp_hours"] ? String(f["camp_hours"]) : null,

    extendedHours,
    extendedHoursInfo,

    registrationOpens,
    registrationCloses,

    // If you later add "Waitlist Only" in Airtable, map it here:
    waitlistOnly: toBool(f["Waitlist Only"]),

    websiteUrl: f["Website"] ? String(f["Website"]) : null,

    // Your UI reads this for the banner stripe. If you don't have it, keep null.
    color: f["color"] ? String(f["color"]) : null,

    // CampFilters calls camp.campSchedule.includes(...) so MUST be an array.
    // If you add a field for schedule later, map it to an array of strings.
    campSchedule: Array.isArray(f["campSchedule"])
      ? f["campSchedule"]
      : Array.isArray(f["Schedule"])
        ? f["Schedule"]
        : [],

    seasonStart,
    seasonEnd,

    // Optional fields your detail page might want later:
    pricingDetails: f["pricing_details"] ? String(f["pricing_details"]) : null,
    additionalInfo: f["add_info"] ? String(f["add_info"]) : null,

    // This can help you debug / transition:
    isRegistrationOpen,
  };
});

res.json(camps);
