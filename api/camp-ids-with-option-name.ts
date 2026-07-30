/**
 * Camp ids that have at least one Registration_Options row with option_name filled.
 * Used by the frontend for the "most detail first" sort.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCampIdsWithOptionName } from "./_lib/airtable.js";
import { sendError } from "./_lib/respond.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    return res.status(200).json(await getCampIdsWithOptionName());
  } catch (error) {
    return sendError(res, "api/camp-ids-with-option-name", error);
  }
}
