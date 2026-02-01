/**
 * Vercel handler for GET /api/camps_similar?slug=:slug (invoked via rewrite from /api/camps/:slug/similar).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCamps } from "./camps/index";

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
    const camp = camps.find((c) => c.slug === slug) ?? null;
    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }
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
  } catch (e) {
    console.error("Camps similar API error:", e);
    return res.status(500).json({ error: "Failed to fetch similar camps", message: (e as Error)?.message ?? String(e) });
  }
}
