/**
 * Single Airtable client used by both the Vercel serverless handlers and the Express server.
 *
 * Two rules this module exists to enforce:
 *  1. Credentials are read from process.env on every call, never captured at module load, so a
 *     rotated key takes effect as soon as the process can see it.
 *  2. An Airtable failure is thrown, never turned into an empty list. Returning [] for a rejected
 *     API key renders the site as "no camps found" with a 200, which is indistinguishable from a
 *     working site with an empty base.
 */
import { createHash } from "node:crypto";
import type { Camp, RegistrationOption } from "../../shared/schema.js";

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";
const DEFAULT_CAMPS_TABLE = "Camps";
const REGISTRATION_OPTIONS_TABLE = "Registration_Options";
const FEEDBACK_TABLE = "Feedback";

export type AirtableFailureCode =
  | "missing_credentials"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "upstream_error"
  | "network_error";

const HTTP_STATUS_BY_CODE: Record<AirtableFailureCode, number> = {
  missing_credentials: 503,
  unauthorized: 503,
  forbidden: 503,
  not_found: 502,
  rate_limited: 503,
  upstream_error: 502,
  network_error: 502,
};

export class AirtableError extends Error {
  readonly code: AirtableFailureCode;
  readonly upstreamStatus: number | null;
  readonly httpStatus: number;

  constructor(code: AirtableFailureCode, message: string, upstreamStatus: number | null = null) {
    super(message);
    this.name = "AirtableError";
    this.code = code;
    this.upstreamStatus = upstreamStatus;
    this.httpStatus = HTTP_STATUS_BY_CODE[code];
  }
}

/** Turns any thrown value into the status + JSON body an API route should send back. */
export function describeError(error: unknown): {
  status: number;
  body: { error: string; code: string; upstreamStatus?: number };
} {
  if (error instanceof AirtableError) {
    return {
      status: error.httpStatus,
      body: {
        error: error.message,
        code: error.code,
        ...(error.upstreamStatus ? { upstreamStatus: error.upstreamStatus } : {}),
      },
    };
  }
  return {
    status: 500,
    body: {
      error: error instanceof Error ? error.message : String(error),
      code: "internal_error",
    },
  };
}

const PLACEHOLDER_PATTERNS = [/^replace_with/i, /^your[_-]/i, /^changeme$/i, /^x{3,}$/i, /^<.+>$/];

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Reads a credential, tolerating the whitespace and quotes that come along when a freshly
 * rotated key is pasted into a dashboard or .env file. A stray trailing newline in the token
 * is enough to make Airtable answer 401.
 */
export function readCredential(name: string): string | undefined {
  const raw = process.env[name];
  if (typeof raw !== "string") return undefined;

  let value = raw.trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }
  if (!value || isPlaceholder(value)) return undefined;
  return value;
}

export type CredentialState = "missing" | "placeholder" | "set";

export function credentialState(name: string): CredentialState {
  const raw = process.env[name];
  if (typeof raw !== "string" || raw.trim() === "") return "missing";
  return readCredential(name) ? "set" : "placeholder";
}

/** Stable, non-reversible id for a secret, so logs can show *which* key is in use. */
export function fingerprint(secret: string | undefined): string | null {
  if (!secret) return null;
  const digest = createHash("sha256").update(secret).digest("hex").slice(0, 8);
  return `${secret.slice(0, 3)}…${digest}`;
}

/** Enough of an identifier to tell two bases apart without publishing the whole thing. */
export function maskId(value: string | undefined): string | null {
  if (!value) return null;
  if (value.length <= 8) return value;
  return `${value.slice(0, 3)}…${value.slice(-4)}`;
}

export interface AirtableConfig {
  apiKey: string;
  baseId: string;
  campsTable: string;
}

export function getAirtableConfig(): AirtableConfig {
  const apiKey = readCredential("AIRTABLE_API_KEY");
  const baseId = readCredential("AIRTABLE_BASE_ID");
  const campsTable = readCredential("AIRTABLE_TABLE_NAME") ?? DEFAULT_CAMPS_TABLE;

  const missing = [
    apiKey ? null : "AIRTABLE_API_KEY",
    baseId ? null : "AIRTABLE_BASE_ID",
  ].filter((name): name is string => name !== null);

  if (missing.length > 0) {
    throw new AirtableError(
      "missing_credentials",
      `Airtable is not configured: ${missing.join(" and ")} ${missing.length === 1 ? "is" : "are"} missing or still set ` +
        "to a placeholder. Set the value in .env for local dev and in the hosting provider's environment variables for " +
        "deployments, then restart/redeploy.",
    );
  }

  return { apiKey: apiKey!, baseId: baseId!, campsTable };
}

/** Non-throwing view of the credential state, for health checks and startup logs. */
export function describeAirtableConfig(): {
  configured: boolean;
  apiKey: CredentialState;
  baseId: CredentialState;
  apiKeyFingerprint: string | null;
  baseIdMasked: string | null;
  campsTable: string;
} {
  const apiKey = readCredential("AIRTABLE_API_KEY");
  const baseId = readCredential("AIRTABLE_BASE_ID");
  return {
    configured: Boolean(apiKey && baseId),
    apiKey: credentialState("AIRTABLE_API_KEY"),
    baseId: credentialState("AIRTABLE_BASE_ID"),
    apiKeyFingerprint: fingerprint(apiKey),
    baseIdMasked: maskId(baseId),
    campsTable: readCredential("AIRTABLE_TABLE_NAME") ?? DEFAULT_CAMPS_TABLE,
  };
}

export interface AirtableRecord {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
}

interface AirtableListResponse {
  records?: AirtableRecord[];
  offset?: string;
}

function extractAirtableMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: string | { type?: string; message?: string } };
    if (typeof parsed.error === "string") return parsed.error;
    if (parsed.error?.message) return parsed.error.message;
    if (parsed.error?.type) return parsed.error.type;
  } catch {
    // Airtable occasionally answers with plain text (e.g. behind its edge).
  }
  return body.slice(0, 200).trim();
}

async function toAirtableError(response: Response, config: AirtableConfig, table: string): Promise<AirtableError> {
  const detail = extractAirtableMessage(await response.text().catch(() => ""));
  const keyId = fingerprint(config.apiKey);
  const suffix = detail ? ` Airtable said: ${detail}` : "";

  switch (response.status) {
    case 401:
      return new AirtableError(
        "unauthorized",
        `Airtable rejected AIRTABLE_API_KEY (${keyId}) with 401. The token is invalid, expired, or has been revoked — ` +
          "if it was just rotated, update the value everywhere the app runs (.env locally, the hosting provider's " +
          `environment variables for deployments) and restart/redeploy.${suffix}`,
        401,
      );
    case 403:
      return new AirtableError(
        "forbidden",
        `Airtable refused AIRTABLE_API_KEY (${keyId}) with 403 for base ${maskId(config.baseId)}. The token is not ` +
          "allowed to read this base — in Airtable's developer hub, give it the data.records:read scope and add this " +
          `base to its access list. A newly rotated token has neither until you grant them.${suffix}`,
        403,
      );
    case 404:
      return new AirtableError(
        "not_found",
        `Airtable returned 404 for table "${table}" in base ${maskId(config.baseId)}. Check AIRTABLE_BASE_ID against the ` +
          `base URL (airtable.com/appXXXXXXXX/...) and that the table name or id is correct.${suffix}`,
        404,
      );
    case 422:
      return new AirtableError("upstream_error", `Airtable rejected the request for "${table}" (422).${suffix}`, 422);
    case 429:
      return new AirtableError("rate_limited", `Airtable rate limit hit while reading "${table}" (429).${suffix}`, 429);
    default:
      return new AirtableError(
        "upstream_error",
        `Airtable request for "${table}" failed with ${response.status}.${suffix}`,
        response.status,
      );
  }
}

async function airtableFetch(url: string, init: RequestInit, config: AirtableConfig, table: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch (cause) {
    throw new AirtableError(
      "network_error",
      `Could not reach Airtable while reading "${table}": ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }

  if (!response.ok) {
    throw await toAirtableError(response, config, table);
  }

  return response.json();
}

/** Fetches every record of a table, following Airtable's pagination. Throws on any failure. */
export async function listRecords(table: string, config?: AirtableConfig): Promise<AirtableRecord[]> {
  const resolved = config ?? getAirtableConfig();
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`${AIRTABLE_API_BASE}/${resolved.baseId}/${encodeURIComponent(table)}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const data = (await airtableFetch(url.toString(), { method: "GET" }, resolved, table)) as AirtableListResponse;
    records.push(...(data.records ?? []));
    offset = data.offset;
  } while (offset);

  return records;
}

function generateSlug(name: string, id: string): string {
  const base = (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return base || id;
}

function parseAgeGroup(ageGroup: unknown): { min: number | null; max: number | null } {
  if (typeof ageGroup !== "string" || !ageGroup) return { min: null, max: null };

  const range = ageGroup.match(/(\d+)\s*-\s*(\d+)/);
  if (range) return { min: parseInt(range[1], 10), max: parseInt(range[2], 10) };

  const single = ageGroup.match(/(\d+)\+?/);
  if (single) return { min: parseInt(single[1], 10), max: null };

  return { min: null, max: null };
}

function isHidden(record: AirtableRecord): boolean {
  return record.fields?.hide === true || record.fields?.Hide === true;
}

function mapCampRecord(record: AirtableRecord, hasRegistrationDetail: boolean): Camp {
  const fields = record.fields ?? {};
  const age = parseAgeGroup(fields["Age Group"]);
  const name = (fields["Camp Name"] as string) || "Unnamed Camp";

  return {
    id: record.id,
    name,
    slug: generateSlug(name, record.id),
    organization: (fields.Organization as string) || null,
    description: (fields.Description as string) || null,
    categories: Array.isArray(fields.Interests) ? (fields.Interests as string[]) : [],
    ageMin: age.min,
    ageMax: age.max,
    locationCity: (fields["Location City"] as string) || null,
    locationAddress: (fields.Location as string) || null,
    priceMin: (fields["Price Min"] as number) ?? null,
    priceMax: (fields["Price Max"] as number) ?? null,
    registrationOpens: (fields["Registration Opens"] as string) || null,
    registrationCloses: (fields["Registration Closes"] as string) || null,
    seasonStart: (fields["Start Date"] as string) || null,
    seasonEnd: (fields["End Date"] as string) || null,
    campHours: (fields.camp_hours as string) || null,
    extendedHours: Boolean(fields.ex_hours),
    extendedHoursInfo: (fields.ex_hours as string) || null,
    waitlistOnly: (fields["Waitlist Only"] as boolean) || false,
    siblingDiscountNote: (fields["Sibling Discount"] as string) || null,
    websiteUrl: (fields.Website as string) || null,
    color: (fields.Color as string) || null,
    additionalInfo: (fields["Additional Info"] as string) || null,
    pricingDetails: (fields.pricing_details as string) || null,
    campSchedule: Array.isArray(fields["Schedule Availability"]) ? (fields["Schedule Availability"] as string[]) : [],
    hasRegistrationDetail,
  };
}

/** Airtable link fields come back as string[] or { id }[], and the column has been renamed a few times. */
function getLinkedCampId(fields: Record<string, unknown>): string {
  for (const key of ["Camps", "Camps 2", "Camp"]) {
    const raw = (fields[key] as unknown[] | undefined)?.[0];
    if (typeof raw === "string") return raw;
    if (raw && typeof raw === "object" && "id" in raw) return (raw as { id: string }).id ?? "";
  }
  return "";
}

function campIdsWithOptionName(records: AirtableRecord[]): Set<string> {
  const ids = new Set<string>();
  for (const record of records) {
    const fields = record.fields ?? {};
    const campId = getLinkedCampId(fields);
    const optionName = String(fields.option_name ?? fields["Option Name"] ?? "").trim();
    if (campId && optionName) ids.add(campId);
  }
  return ids;
}

/**
 * The camp list. Registration_Options only feeds a sort hint, so a failure there degrades the
 * ordering with a logged warning instead of taking the whole page down.
 */
export async function getCamps(): Promise<Camp[]> {
  const config = getAirtableConfig();
  const campRecords = await listRecords(config.campsTable, config);

  let detailIds = new Set<string>();
  try {
    detailIds = campIdsWithOptionName(await listRecords(REGISTRATION_OPTIONS_TABLE, config));
  } catch (error) {
    console.warn(
      `[airtable] Could not read ${REGISTRATION_OPTIONS_TABLE}; camps will be sorted without registration detail:`,
      error instanceof Error ? error.message : error,
    );
  }

  return campRecords.filter((record) => !isHidden(record)).map((record) => mapCampRecord(record, detailIds.has(record.id)));
}

export async function getCampBySlug(slug: string): Promise<Camp | null> {
  const camps = await getCamps();
  return camps.find((camp) => camp.slug === slug) ?? null;
}

export function selectSimilarCamps(camps: Camp[], camp: Camp, limit = 4): Camp[] {
  return camps
    .filter((candidate) => candidate.id !== camp.id)
    .filter((candidate) => {
      const sharesCategory = candidate.categories.some((category) => camp.categories.includes(category));
      const overlapsAge =
        candidate.ageMin !== null &&
        candidate.ageMax !== null &&
        camp.ageMin !== null &&
        camp.ageMax !== null &&
        candidate.ageMin <= (camp.ageMax ?? 18) &&
        candidate.ageMax >= (camp.ageMin ?? 0);
      return sharesCategory || overlapsAge;
    })
    .sort((a, b) => {
      const aHasReg = Boolean(a.registrationOpens || a.registrationCloses);
      const bHasReg = Boolean(b.registrationOpens || b.registrationCloses);
      if (aHasReg && !bHasReg) return -1;
      if (!aHasReg && bHasReg) return 1;
      return 0;
    })
    .slice(0, limit);
}

function parseDate(value: string | undefined): string | null {
  if (!value) return null;
  const [month, day, year] = value.split("/");
  if (!month || !day || !year) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function splitCsv(value: unknown): string[] {
  return typeof value === "string" && value.length > 0 ? value.split(",").map((part) => part.trim()) : [];
}

function parsePrices(value: unknown): number[] {
  return splitCsv(value)
    .map((part) => parseFloat(part))
    .filter((price) => !Number.isNaN(price));
}

export async function getRegistrationOptions(): Promise<RegistrationOption[]> {
  const records = await listRecords(REGISTRATION_OPTIONS_TABLE);
  const options: RegistrationOption[] = [];

  for (const record of records) {
    const fields = record.fields ?? {};
    const campId = getLinkedCampId(fields);
    const optionNames = splitCsv(fields.option_name);
    const names = optionNames.length > 0 ? optionNames : ["Session"];
    const dates = splitCsv(fields.dates_csv);
    const prices = parsePrices(fields.price);
    const extendedPrices = parsePrices(fields.ex_hours_price);

    names.forEach((name, index) => {
      const [startStr, endStr] = (dates[index] ?? "").split("-").map((part) => part.trim());
      options.push({
        id: `${record.id}-${index}`,
        campId,
        sessionName: name || `Session ${index + 1}`,
        startDate: parseDate(startStr),
        endDate: parseDate(endStr),
        price: prices[index] ?? null,
        extendedPrice: extendedPrices[index] ?? null,
        ageMin: (fields.age_min as number) ?? null,
        ageMax: (fields.age_max as number) ?? null,
        registrationOpens: (fields.registration_opens as string) || null,
        registrationCloses: (fields.registration_closes as string) || null,
        waitlistOnly: (fields.waitlist_only as boolean) || false,
        color: (fields.color as string) || null,
      });
    });
  }

  return options;
}

export async function getSessionsForCamp(campId: string): Promise<RegistrationOption[]> {
  const options = await getRegistrationOptions();
  return options.filter((option) => option.campId === campId);
}

/** Camp ids with at least one Registration_Options row that has option_name filled. */
export async function getCampIdsWithOptionName(): Promise<string[]> {
  return Array.from(campIdsWithOptionName(await listRecords(REGISTRATION_OPTIONS_TABLE)));
}

export async function createFeedbackRecord(fields: Record<string, unknown>): Promise<AirtableRecord> {
  const config = getAirtableConfig();
  const url = `${AIRTABLE_API_BASE}/${config.baseId}/${encodeURIComponent(FEEDBACK_TABLE)}`;
  const data = (await airtableFetch(
    url,
    { method: "POST", body: JSON.stringify({ typecast: true, records: [{ fields }] }) },
    config,
    FEEDBACK_TABLE,
  )) as { records?: AirtableRecord[] };

  const created = data.records?.[0];
  if (!created) {
    throw new AirtableError("upstream_error", `Airtable accepted the ${FEEDBACK_TABLE} write but returned no record.`);
  }
  return created;
}

export interface AirtableConnectionStatus {
  ok: boolean;
  configured: boolean;
  apiKey: CredentialState;
  baseId: CredentialState;
  apiKeyFingerprint: string | null;
  baseIdMasked: string | null;
  campsTable: string;
  code?: AirtableFailureCode | "internal_error";
  error?: string;
}

/** One cheap read used by health checks and the dev-server startup banner. */
export async function checkAirtableConnection(): Promise<AirtableConnectionStatus> {
  const described = describeAirtableConfig();
  try {
    const config = getAirtableConfig();
    const url = new URL(`${AIRTABLE_API_BASE}/${config.baseId}/${encodeURIComponent(config.campsTable)}`);
    url.searchParams.set("pageSize", "1");
    await airtableFetch(url.toString(), { method: "GET" }, config, config.campsTable);
    return { ok: true, ...described };
  } catch (error) {
    const { body } = describeError(error);
    return { ok: false, ...described, code: body.code as AirtableConnectionStatus["code"], error: body.error };
  }
}
