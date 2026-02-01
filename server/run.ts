/**
 * Load .env from project root first, then start the app.
 * This ensures Airtable credentials are available no matter where you run npm run dev from.
 */
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env");

const envExists = fs.existsSync(envPath);
let raw = envExists ? fs.readFileSync(envPath, "utf-8") : "";

if (envExists && raw.length === 0) {
  const template =
    "AIRTABLE_API_KEY=replace_with_your_airtable_key\nAIRTABLE_BASE_ID=replace_with_your_base_id\nSESSION_SECRET=replace_with_your_secret\nAIRTABLE_TABLE_NAME=Camps\n";
  fs.writeFileSync(envPath, template, "utf-8");
  raw = template;
}

const result = dotenv.config({ path: envPath });
if (result.parsed && !Object.keys(result.parsed).includes("AIRTABLE_TABLE_NAME") && envExists) {
  fs.appendFileSync(envPath, "\nAIRTABLE_TABLE_NAME=tblfYY7FyJ4mzS3Mb\n", "utf-8");
  process.env.AIRTABLE_TABLE_NAME = "tblfYY7FyJ4mzS3Mb";
}

await import("./index.ts");
