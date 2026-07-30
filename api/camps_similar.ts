/** Vercel handler for GET /api/camps_similar?slug=:slug */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCamps, selectSimilarCamps } from "./_lib/airtable";
import { sendError } from "./_lib/respond";

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
    const camp = camps.find((candidate) => candidate.slug === slug);
    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }
    return res.status(200).json(selectSimilarCamps(camps, camp, 4));
  } catch (error) {
    return sendError(res, "api/camps_similar", error);
  }
}
