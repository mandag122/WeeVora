import type { VercelRequest, VercelResponse } from "@vercel/node";

const TABLE_NAME = "Feedback";

// Airtable field names (exact)
const F_NAME = "Name";
const F_EMAIL = "Email";
const F_REASON = "Reason";
const F_MESSAGE = "Message";
const F_SUBMITTED_ON = "Submitted On";
const F_RELATED_CAMP = "Related Camp";
const F_STATUS = "Status";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v.trim() : undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Basic origin protection (adjust to your domains)
    const origin = req.headers.origin;
    const allowedOrigins = new Set([
      "https://weevora.com",
      "https://www.weevora.com",
      // add your preview domains if needed
    ]);
    if (origin && !allowedOrigins.has(origin)) {
      return res.status(403).json({ error: "Forbidden origin" });
    }

    if (!isPlainObject(req.body)) {
      return res.status(400).json({ error: "Body must be a JSON object." });
    }

    const body = req.body;

    // Honeypot: your form can include <input name="website" style="display:none" />
    // Bots often fill it; humans won't.
    const honeypot = asString(body["website"]);
    if (honeypot) {
      return res.status(200).json({ ok: true }); // pretend success
    }

    // Accept either "friendly" keys or exact Airtable field names
    const name = asString(body["name"]) ?? asString(body[F_NAME]);
    const email = asString(body["email"]) ?? asString(body[F_EMAIL]);
    const reason = asString(body["reason"]) ?? asString(body[F_REASON]);
    const message = asString(body["message"]) ?? asString(body[F_MESSAGE]);

    // Optional: allow linking to a Camp record (Airtable record id like "recXXXX...")
    const relatedCampRecId =
      asString(body["relatedCampId"]) ??
      (Array.isArray(body[F_RELATED_CAMP]) ? undefined : asString(body[F_RELATED_CAMP]));

    // Optional status (usually you might *not* want the public form setting this)
    const status = asString(body[F_STATUS]) ?? asString(body["status"]);

    if (!message || (!email && !name)) {
      return res.status(400).json({
        error: 'Provide "message" and at least one of "email" or "name".',
      });
    }

    const fieldsToWrite: Record<string, unknown> = {
      [F_MESSAGE]: message,
      [F_SUBMITTED_ON]: new Date().toISOString(),
    };

    if (name) fieldsToWrite[F_NAME] = name;
    if (email) fieldsToWrite[F_EMAIL] = email;
    if (reason) fieldsToWrite[F_REASON] = reason;
    if (status) fieldsToWrite[F_STATUS] = status;

    // Related Camp is a multipleRecordLinks field -> must be an array of record IDs
    if (relatedCampRecId) {
      fieldsToWrite[F_RELATED_CAMP] = [relatedCampRecId];
    }

    const apiKey = requiredEnv("AIRTABLE_API_KEY");
    const baseId = requiredEnv("AIRTABLE_BASE_ID");

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(TABLE_NAME)}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        typecast: true,
        records: [{ fields: fieldsToWrite }],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({
        error: `Airtable create failed (${resp.status})`,
        details: text,
      });
    }

    const data = (await resp.json()) as {
      records: Array<{ id: string; createdTime: string; fields: Record<string, unknown> }>;
    };

    return res.status(201).json({ record: data.records[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
