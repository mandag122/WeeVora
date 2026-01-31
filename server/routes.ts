import type { Express } from "express";
import { createServer, type Server } from "http";
import { fetchCamps, getCampBySlug, getSessionsForCamp, getSimilarCamps } from "./airtable";

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

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // For now, just log the contact form submission
      // In production, this would send an email or save to database
      console.log("Contact form submission:", { name, email, subject, message });
      
      res.json({ success: true, message: "Message received" });
    } catch (error) {
      console.error("Error processing contact form:", error);
      res.status(500).json({ error: "Failed to process contact form" });
    }
  });

  return httpServer;
}
