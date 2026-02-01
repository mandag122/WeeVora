export default async function handler(req, res) {
  try {
    const key = process.env.AIRTABLE_API_KEY;
    const base = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_TABLE_NAME || "Camps";

    // HARD STOP: show whether env vars exist
    if (!key || !base) {
      return res.status(500).json({
        error: "Missing env vars",
        hasKey: Boolean(key),
        hasBase: Boolean(base),
        table,
      });
    }

    // HARD STOP: verify we can reach Airtable (no parsing yet)
    const url = `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}?pageSize=10`;

    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
    });

    const text = await r.text();

    return res.status(r.ok ? 200 : r.status).json({
      ok: r.ok,
      status: r.status,
      airtableSample: text.slice(0, 500), // preview first 500 chars
      urlUsed: url,
    });
  } catch (e) {
    return res.status(500).json({
      error: "Handler crashed",
      message: e?.message || String(e),
      stack: e?.stack || null,
    });
  }
}
