import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import { checkAirtableConnection } from "../api/_lib/airtable.js";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

/**
 * One live read at startup, so a revoked or mistyped key is reported here instead of showing up
 * later as a camps page with zero results.
 */
async function reportAirtableStatus() {
  const status = await checkAirtableConnection();
  const where = `base ${status.baseIdMasked ?? "?"}, table "${status.campsTable}", key ${status.apiKeyFingerprint ?? "none"}`;

  if (status.ok) {
    console.log(`\n>>> [WeeVora] Airtable reachable (${where}). Camps should load.\n`);
    return;
  }
  console.error(`\n>>> [WeeVora] Airtable check FAILED (${status.code}) — the camps pages will show an error.`);
  console.error(`>>> ${status.error}`);
  console.error(`>>> AIRTABLE_API_KEY: ${status.apiKey}, AIRTABLE_BASE_ID: ${status.baseId}, table: "${status.campsTable}"\n`);
}

(async () => {
  await registerRoutes(httpServer, app);
  void reportAirtableStatus();

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite.js");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    console.error("Server failed to start:", err.message);
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Try another port or stop the other process.`);
    }
  });
})();
