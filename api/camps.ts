import type { VercelRequest, VercelResponse } from "@vercel/node";

const TABLE_NAME = "Camps";

type AirtableRecord = {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
};

type AirtableListResponse = {
  records: AirtableRecord[];
  offset?: string;
};

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function setCommonHeaders(res: VercelResponse) {
  // Same-origin by default; if you need cross-origin, uncomment the next line:
  // res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

async function airtableListAll(tableName: string): Promise<AirtableRecord[]> {
  const apiKey = requiredEnv("AIRTABLE_API_KEY");
  const baseId = requiredEnv("AIRTABLE_BASE_ID");

  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`
    );
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const resp = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Airtable list failed (${resp.status}): ${text}`);
    }

    const data = (await resp.json()) as AirtableListResponse;
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    setCommonHeaders(res);

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const records = await airtableListAll(TABLE_NAME);

    return res.status(200).json({
      records: records.map((r) => ({
        id: r.id,
        createdTime: r.createdTime,
        fields: r.fields,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
