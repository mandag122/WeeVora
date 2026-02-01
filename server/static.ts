import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Vite builds to project root /dist; server runs from server/ so go up one and into dist
  const distPath = path.resolve(import.meta.dirname, "..", "dist");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, run "npm run build" first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html for client-side routing
  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
