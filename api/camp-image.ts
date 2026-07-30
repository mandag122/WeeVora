/**
 * GET /api/camp-image?camp=recXXXXXXXXXXXXXX&i=0&size=large
 *
 * Redirects to the camp photo's current Airtable url. Airtable signs attachment urls and expires
 * them about two hours after handing them over, so they can never be embedded in a page or cached
 * response; this endpoint is the stable address that gets embedded instead, and it looks the real
 * url up per request. The redirect is cached well inside the expiry window, which keeps the number
 * of Airtable reads low without ever serving a dead link.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { type ImageSize, resolveCampImage } from "./_lib/airtable.js";
import { sendError } from "./_lib/respond.js";

const RECORD_ID = /^rec[A-Za-z0-9]{10,20}$/;
const MAX_INDEX = 9;
const SIZES: ImageSize[] = ["small", "large", "full"];

function isImageSize(value: string): value is ImageSize {
  return (SIZES as string[]).includes(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const camp = String(req.query.camp ?? "");
  const index = Number(req.query.i ?? NaN);
  const size = String(req.query.size ?? "full");

  if (!RECORD_ID.test(camp) || !Number.isInteger(index) || index < 0 || index > MAX_INDEX || !isImageSize(size)) {
    return res.status(400).json({ error: "Invalid image request" });
  }

  try {
    const target = await resolveCampImage(camp, index, size);

    if (!target) {
      // The photo was removed in Airtable. The page hides the slot on error, so this is not a
      // broken image for the visitor - just say so briefly and let it be re-checked soon.
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
      return res.status(404).json({ error: "Image not found" });
    }

    // Well under Airtable's ~2 hour expiry: a redirect served at the end of its cache life still
    // points at a url with more than an hour of life left.
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=1800");
    return res.redirect(302, target);
  } catch (error) {
    return sendError(res, "api/camp-image", error);
  }
}
