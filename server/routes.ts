import type { Express } from "express";
import { createServer, type Server } from "http";
import { fetchCamps, getCampBySlug, getSessionsForCamp, getSimilarCamps, submitContactForm } from "./airtable";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all camps
  app.get("/api/camps", async (req, res) => {
    try {
      const camps = await fetchCamps();
      res.json(camps);
    } catch (error) {
      console.error("Error fetching camps:", error);
      res.status(500).json({ error: "Failed to fetch camps" });
    }
  });

  // Get single camp by slug
  app.get("/api/camps/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const camp = await getCampBySlug(slug);
      
      if (!camp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      res.json(camp);
    } catch (error) {
      console.error("Error fetching camp:", error);
      res.status(500).json({ error: "Failed to fetch camp" });
    }
  });

  // Get sessions for a camp
  app.get("/api/camps/:slug/sessions", async (req, res) => {
    try {
      const { slug } = req.params;
      const camp = await getCampBySlug(slug);
      
      if (!camp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      const sessions = await getSessionsForCamp(camp.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Get similar camps
  app.get("/api/camps/:slug/similar", async (req, res) => {
    try {
      const { slug } = req.params;
      const camp = await getCampBySlug(slug);
      
      if (!camp) {
        return res.status(404).json({ error: "Camp not found" });
      }
      
      const similarCamps = await getSimilarCamps(camp, 4);
      res.json(similarCamps);
    } catch (error) {
      console.error("Error fetching similar camps:", error);
      res.status(500).json({ error: "Failed to fetch similar camps" });
    }
  });

  // Same handlers via query param (so frontend can call these on Vercel without rewrites)
  app.get("/api/camps_slug", async (req, res) => {
    try {
      const slug = (req.query.slug as string) || "";
      if (!slug) return res.status(400).json({ error: "Missing slug" });
      const camp = await getCampBySlug(slug);
      if (!camp) return res.status(404).json({ error: "Camp not found" });
      res.json(camp);
    } catch (error) {
      console.error("Error fetching camp:", error);
      res.status(500).json({ error: "Failed to fetch camp" });
    }
  });
  app.get("/api/camps_sessions", async (req, res) => {
    try {
      const slug = (req.query.slug as string) || "";
      if (!slug) return res.status(400).json({ error: "Missing slug" });
      const camp = await getCampBySlug(slug);
      if (!camp) return res.status(404).json({ error: "Camp not found" });
      const sessions = await getSessionsForCamp(camp.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });
  app.get("/api/camps_similar", async (req, res) => {
    try {
      const slug = (req.query.slug as string) || "";
      if (!slug) return res.status(400).json({ error: "Missing slug" });
      const camp = await getCampBySlug(slug);
      if (!camp) return res.status(404).json({ error: "Camp not found" });
      const similarCamps = await getSimilarCamps(camp, 4);
      res.json(similarCamps);
    } catch (error) {
      console.error("Error fetching similar camps:", error);
      res.status(500).json({ error: "Failed to fetch similar camps" });
    }
  });

  // Contact form submission - saves to Airtable Feedback table
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      
      const success = await submitContactForm({ name, email, subject, message });
      
      if (!success) {
        // Still return success to user even if Airtable fails - log for review
        console.log("Contact form (fallback log):", { name, email, subject, message });
      }
      
      res.json({ success: true, message: "Message received" });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ error: "Failed to process contact form" });
    }
  });

  return httpServer;
}
