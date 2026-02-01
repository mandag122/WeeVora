import type { VercelRequest, VercelResponse } from "@vercel/node";

const TABLE_NAME = "Camps";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const AIRTABLE_API_KEY = requireEnv("AIRTABLE_API_KEY");
    const AIRTABLE_BASE_ID = requireEnv("AIRTABLE_BASE_ID");

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
      TABLE_NAME
    )}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    return res.status(200).json(data.records);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
