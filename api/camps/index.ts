/**
 * Vercel serverless handler for /api/camps.
 * Returns the same Camp[] shape as the Express server so the frontend works on weevora.com.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCamps } from "../../lib/vercel-camps";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const key = process.env.AIRTABLE_API_KEY;
    const base = process.env.AIRTABLE_BASE_ID;
    if (!key || !base) {
      return res.status(500).json({ error: "Missing env vars", hasKey: Boolean(key), hasBase: Boolean(base) });
    }

    const camps = await getCamps();
    return res.status(200).json(camps);
  } catch (e) {
    console.error("Camps API error:", e);
    return res.status(500).json({
      error: "Handler crashed",
      message: (e as Error)?.message ?? String(e),
    });
  }
}
