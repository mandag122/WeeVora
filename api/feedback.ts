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

function setCommonHeaders(res: VercelResponse) {
  // If your contact form is on the same domain, you don't need CORS.
  // If you later post from another domain, uncomment:
  // res.setHeader("Access-Control-Allow-Origin", "https://weevora.com");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v.trim() : undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    setCommonHeaders(res);

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    if (!isPlainObject(req.body)) {
      return res.status(400).json({ error: "Body must be a JSON object." });
    }

    // Honeypot (optional): if your form includes a hidden "website" field, bots often fill it.
    const honeypot = asString(req.body["website"]);
    if (honeypot) {
      // Pretend success (reduces bot retries)
      return res.status(200).json({ ok: true });
    }

    // Friendly keys
    const name = asString(req.body["name"]);
    const email = asString(req.body["email"]);
    const reason = asString(req.body["reason"]);
    const message = asString(req.body["message"]);

    // Optional: allow linking to a Camp record id
    const relatedCampId = asString(req.body["relatedCampId"]);

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

    // Optional status (you can remove this if you don't want public setting it)
    const status = asString(req.body["status"]);
    if (status) fieldsToWrite[F_STATUS] = status;

    // Linked record field expects an array of record IDs
    if (relatedCampId) fieldsToWrite[F_RELATED_CAMP] = [relatedCampId];

    const apiKey = requiredEnv("AIRTABLE_API_KEY");
    const baseId = requiredEnv("AIRTABLE_BASE_ID");

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
      TABLE_NAME
    )}`;

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
