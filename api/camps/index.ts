/** Vercel serverless handler for GET /api/camps (list). */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCamps } from "../_lib/airtable.js";
import { sendError } from "../_lib/respond.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    return res.status(200).json(await getCamps());
  } catch (error) {
    return sendError(res, "api/camps", error);
  }
}
