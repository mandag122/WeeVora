import type { Express, Response } from "express";
import { type Server } from "http";
import {
  checkAirtableConnection,
  createFeedbackRecord,
  describeAirtableConfig,
  describeError,
  getCampBySlug,
  getCampIdsWithOptionName,
  getCamps,
  getSessionsForCamp,
  selectSimilarCamps,
} from "../api/_lib/airtable";

function sendError(res: Response, context: string, error: unknown): Response {
  const { status, body } = describeError(error);
  console.error(`[${context}] ${body.code}: ${body.error}`);
  return res.status(status).json(body);
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Mirrors api/ping.ts: liveness with nothing left to fail.
  app.get("/api/ping", (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString(), runtime: process.version });
  });

  app.get("/api/health", async (req, res) => {
    const runtime = { time: new Date().toISOString(), runtime: process.version };
    if (req.query.airtable !== "1" && req.query.airtable !== "true") {
      return res.json({ ok: true, ...runtime, airtable: describeAirtableConfig() });
    }
    const airtable = await checkAirtableConnection();
    return res.status(airtable.ok ? 200 : 503).json({ ok: airtable.ok, ...runtime, airtable });
  });

  // Camp IDs that have option_name in Registration_Options (for "most detail first" sort)
  app.get("/api/camp-ids-with-option-name", async (_req, res) => {
    try {
      res.json(await getCampIdsWithOptionName());
    } catch (error) {
      sendError(res, "GET /api/camp-ids-with-option-name", error);
    }
  });

  app.get("/api/camps", async (_req, res) => {
    try {
      res.json(await getCamps());
    } catch (error) {
      sendError(res, "GET /api/camps", error);
    }
  });

  const sendCamp = async (res: Response, context: string, slug: string) => {
    if (!slug) return res.status(400).json({ error: "Missing slug" });
    try {
      const camp = await getCampBySlug(slug);
      if (!camp) return res.status(404).json({ error: "Camp not found" });
      return res.json(camp);
    } catch (error) {
      return sendError(res, context, error);
    }
  };

  const sendSessions = async (res: Response, context: string, slug: string) => {
    if (!slug) return res.status(400).json({ error: "Missing slug" });
    try {
      const camp = await getCampBySlug(slug);
      if (!camp) return res.status(404).json({ error: "Camp not found" });
      return res.json(await getSessionsForCamp(camp.id));
    } catch (error) {
      return sendError(res, context, error);
    }
  };

  const sendSimilar = async (res: Response, context: string, slug: string) => {
    if (!slug) return res.status(400).json({ error: "Missing slug" });
    try {
      const camps = await getCamps();
      const camp = camps.find((candidate) => candidate.slug === slug);
      if (!camp) return res.status(404).json({ error: "Camp not found" });
      return res.json(selectSimilarCamps(camps, camp, 4));
    } catch (error) {
      return sendError(res, context, error);
    }
  };

  app.get("/api/camps/:slug", (req, res) => sendCamp(res, "GET /api/camps/:slug", req.params.slug));
  app.get("/api/camps/:slug/sessions", (req, res) =>
    sendSessions(res, "GET /api/camps/:slug/sessions", req.params.slug),
  );
  app.get("/api/camps/:slug/similar", (req, res) =>
    sendSimilar(res, "GET /api/camps/:slug/similar", req.params.slug),
  );

  // Same handlers via query param, mirroring the Vercel rewrites so the frontend can use one URL shape.
  app.get("/api/camps_slug", (req, res) => sendCamp(res, "GET /api/camps_slug", (req.query.slug as string) || ""));
  app.get("/api/camps_sessions", (req, res) =>
    sendSessions(res, "GET /api/camps_sessions", (req.query.slug as string) || ""),
  );
  app.get("/api/camps_similar", (req, res) =>
    sendSimilar(res, "GET /api/camps_similar", (req.query.slug as string) || ""),
  );

  // Contact form submission - saves to the Airtable Feedback table
  app.post("/api/contact", async (req, res) => {
    const { name, email, subject, message } = req.body ?? {};

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    try {
      await createFeedbackRecord({ Name: name, Email: email, Subject: subject || "", Message: message });
      return res.json({ success: true, message: "Message received" });
    } catch (error) {
      const { status, body } = describeError(error);
      console.error(`[POST /api/contact] ${body.code}: ${body.error}`);
      console.log("Contact form (fallback log):", { name, email, subject, message });
      return res.status(status).json({ error: "Failed to send message. Please try again later." });
    }
  });

  return httpServer;
}
