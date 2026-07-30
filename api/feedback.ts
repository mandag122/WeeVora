/** Vercel serverless handler for POST /api/feedback. */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createFeedbackRecord } from "./_lib/airtable.js";
import { sendError } from "./_lib/respond.js";

// Airtable field names (exact)
const F_NAME = "Name";
const F_EMAIL = "Email";
const F_REASON = "Reason";
const F_MESSAGE = "Message";
const F_SUBMITTED_ON = "Submitted On";
const F_RELATED_CAMP = "Related Camp";
const F_STATUS = "Status";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!isPlainObject(req.body)) {
    return res.status(400).json({ error: "Body must be a JSON object." });
  }

  // Bots tend to fill the hidden "website" field; pretend success so they stop retrying.
  if (asString(req.body.website)) {
    return res.status(200).json({ ok: true });
  }

  const name = asString(req.body.name);
  const email = asString(req.body.email);
  const reason = asString(req.body.reason);
  const message = asString(req.body.message);
  const status = asString(req.body.status);
  const relatedCampId = asString(req.body.relatedCampId);

  if (!message || (!email && !name)) {
    return res.status(400).json({ error: 'Provide "message" and at least one of "email" or "name".' });
  }

  const fields: Record<string, unknown> = {
    [F_MESSAGE]: message,
    [F_SUBMITTED_ON]: new Date().toISOString(),
  };
  if (name) fields[F_NAME] = name;
  if (email) fields[F_EMAIL] = email;
  if (reason) fields[F_REASON] = reason;
  if (status) fields[F_STATUS] = status;
  if (relatedCampId) fields[F_RELATED_CAMP] = [relatedCampId];

  try {
    return res.status(201).json({ record: await createFeedbackRecord(fields) });
  } catch (error) {
    return sendError(res, "api/feedback", error);
  }
}
