/** Raw record dump of the camps table, kept for ad-hoc/debug use. */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAirtableConfig, listRecords } from "./_lib/airtable";
import { sendError } from "./_lib/respond";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const config = getAirtableConfig();
    const records = await listRecords(config.campsTable, config);
    return res.status(200).json({
      records: records.map((record) => ({
        id: record.id,
        createdTime: record.createdTime,
        fields: record.fields,
      })),
    });
  } catch (error) {
    return sendError(res, "api/registration-options", error);
  }
}
