/**
 * Vercel catch-all for /api/camps/:slug, /api/camps/:slug/sessions and /api/camps/:slug/similar.
 * Vercel does not always create separate functions for [slug] in subfolders, so this covers all three.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCamps, getSessionsForCamp, selectSimilarCamps } from "../_lib/airtable";
import { sendError } from "../_lib/respond";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rawPath = req.query.path;
  const segments = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];
  if (segments.length === 0 || segments.length > 2) {
    return res.status(404).json({ error: "Not found" });
  }

  const [slug, sub] = segments;

  try {
    const camps = await getCamps();
    const camp = camps.find((candidate) => candidate.slug === slug);
    if (!camp) {
      return res.status(404).json({ error: "Camp not found" });
    }

    if (segments.length === 1) {
      return res.status(200).json(camp);
    }
    if (sub === "sessions") {
      return res.status(200).json(await getSessionsForCamp(camp.id));
    }
    if (sub === "similar") {
      return res.status(200).json(selectSimilarCamps(camps, camp, 4));
    }

    return res.status(404).json({ error: "Not found" });
  } catch (error) {
    return sendError(res, "api/camps/[...path]", error);
  }
}
