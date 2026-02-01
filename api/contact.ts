/**
 * Vercel serverless handler for POST /api/contact (contact form).
 * Writes to Airtable Feedback table with Name, Email, Subject, Message (matches Express server).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const TABLE_NAME = "Feedback";

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v.trim() : undefined;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isPlainObject(req.body)) {
    return res.status(400).json({ error: "Body must be a JSON object." });
  }

  const name = asString(req.body.name);
  const email = asString(req.body.email);
  const subject = asString(req.body.subject);
  const message = asString(req.body.message);

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields: name, email, and message are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    console.error("Contact: missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID");
    return res.status(500).json({ error: "Server configuration error. Please try again later." });
  }

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(TABLE_NAME)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Name: name,
              Email: email,
              Subject: subject ?? "",
              Message: message,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Airtable contact submit error:", response.status, text);
      return res.status(500).json({ error: "Failed to send message. Please try again later." });
    }

    return res.status(200).json({ success: true, message: "Message received" });
  } catch (err) {
    console.error("Contact form error:", err);
    return res.status(500).json({ error: "Failed to send message. Please try again later." });
  }
}
