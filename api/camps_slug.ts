/**
 * Vercel handler for GET /api/camps_slug?slug=:slug (invoked via rewrite from /api/camps/:slug).
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
  try {
    const camps = await getCamps();
    const camp = camps.find((c) => c.slug === slug) ?? null;
    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }
    return res.status(200).json(camp);
  } catch (e) {
    console.error("Camp slug API error:", e);
    return res.status(500).json({ error: "Failed to fetch camp", message: (e as Error)?.message ?? String(e) });
  }
}
