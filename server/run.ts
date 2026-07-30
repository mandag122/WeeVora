/**
 * Loads .env from the project root, reports which Airtable credentials the app will actually use,
 * then starts the app. Running `npm run dev` from a subdirectory still finds the file.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const CREDENTIAL_VARS = ["AIRTABLE_API_KEY", "AIRTABLE_BASE_ID", "AIRTABLE_TABLE_NAME", "SESSION_SECRET"];

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(rootDir, ".env");

if (!fs.existsSync(envPath)) {
  console.warn(
    `[env] No .env found at ${envPath}. Copy .env.example to .env and fill in your Airtable credentials, ` +
      "or export them in the shell before starting.",
  );
} else {
  const fromFile = dotenv.parse(fs.readFileSync(envPath));

  // dotenv never overwrites a variable that is already set. That precedence is right for hosted
  // secrets (Replit, Vercel), but it also means a key you just rotated in .env is silently ignored
  // when a stale copy is exported in the environment — so say so out loud.
  for (const name of CREDENTIAL_VARS) {
    const fileValue = fromFile[name]?.trim();
    const envValue = process.env[name]?.trim();
    if (fileValue && envValue && fileValue !== envValue) {
      console.warn(
        `[env] ${name} is set in both the environment and .env, with different values. The environment wins ` +
          "and the .env value is ignored. Update the environment (Replit Secrets, shell export) or unset it there " +
          "if .env should be the source of truth.",
      );
    }
  }

  dotenv.config({ path: envPath });
}

await import("./index.ts");
