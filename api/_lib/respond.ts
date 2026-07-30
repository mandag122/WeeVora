/**
 * Shared error responses for the Vercel handlers, so an Airtable outage always reaches the
 * browser as a real status code with a diagnosable message.
 */
import type { VercelResponse } from "@vercel/node";
import { describeError } from "./airtable";

export function sendError(res: VercelResponse, context: string, error: unknown): VercelResponse {
  const { status, body } = describeError(error);
  console.error(`[${context}] ${body.code}: ${body.error}`);
  return res.status(status).json(body);
}
