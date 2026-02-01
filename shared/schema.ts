import { z } from "zod";

// Camp interest types (from Airtable Interests column)
export const campInterests = [
  "Sports",
  "Arts",
  "STEM",
  "Nature",
  "Music",
  "Drama",
  "Equestrian",
  "Multi-Activity",
  "Other"
] as const;

export type CampInterest = typeof campInterests[number];

// Interest colors for visual distinction (matching Airtable colors)
export const interestColors: Record<CampInterest, string> = {
  "Sports": "#558B2F",
  "Arts": "#FF7043",
  "STEM": "#117A8B",
  "Nature": "#4A8B6F",
  "Music": "#3D4AA3",
  "Drama": "#C2395A",
  "Equestrian": "#F9B233",
  "Multi-Activity": "#8B5CF6",
  "Other": "#6B7280"
};

// Legacy aliases for backwards compatibility
export const campCategories = campInterests;
export type CampCategory = CampInterest;
export const categoryColors = interestColors;

// Registration option schema (sessions within a camp)
export const registrationOptionSchema = z.object({
  id: z.string(),
  campId: z.string(),
  sessionName: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  price: z.number().nullable(),
  extendedPrice: z.number().nullable(),
  ageMin: z.number().nullable(),
  ageMax: z.number().nullable(),
  registrationOpens: z.string().nullable(),
  registrationCloses: z.string().nullable(),
  waitlistOnly: z.boolean().default(false),
  color: z.string().nullable()
});

export type RegistrationOption = z.infer<typeof registrationOptionSchema>;

// Camp schedule options
export const campScheduleOptions = [
  "Full Week",
  "Partial Week",
  "Daily Drop-in"
] as const;

export type CampScheduleOption = typeof campScheduleOptions[number];

// Camp schema
export const campSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  organization: z.string().nullable(),
  description: z.string().nullable(),
  categories: z.array(z.string()).default([]),
  ageMin: z.number().nullable(),
  ageMax: z.number().nullable(),
  locationCity: z.string().nullable(),
  locationAddress: z.string().nullable(),
  priceMin: z.number().nullable(),
  priceMax: z.number().nullable(),
  registrationOpens: z.string().nullable(),
  registrationCloses: z.string().nullable(),
  seasonStart: z.string().nullable(),
  seasonEnd: z.string().nullable(),
  campHours: z.string().nullable(),
  extendedHours: z.boolean().default(false),
  extendedHoursInfo: z.string().nullable(),
  waitlistOnly: z.boolean().default(false),
  siblingDiscountNote: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  color: z.string().nullable(),
  additionalInfo: z.string().nullable(),
  campSchedule: z.array(z.string()).default([]),
  /** True if camp has at least one Registration_Options row with option_name, dates_csv, price filled. Used for "Most detail first" sort. */
  hasRegistrationDetail: z.boolean().optional()
});

export type Camp = z.infer<typeof campSchema>;

// Selected session for calendar
export const selectedSessionSchema = z.object({
  campId: z.string(),
  campName: z.string(),
  sessionId: z.string(),
  sessionName: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  color: z.string(),
  isExtended: z.boolean().default(false),
  price: z.number().nullable()
});

export type SelectedSession = z.infer<typeof selectedSessionSchema>;

// Filter state
export const filterStateSchema = z.object({
  search: z.string().default(""),
  categories: z.array(z.string()).default([]),
  ageMin: z.number().nullable().default(null),
  ageMax: z.number().nullable().default(null),
  locations: z.array(z.string()).default([]),
  priceMin: z.number().nullable().default(null),
  priceMax: z.number().nullable().default(null),
  registrationStatus: z.enum(["all", "open", "upcoming"]).default("all"),
  extendedHoursOnly: z.boolean().default(false),
  campSchedule: z.array(z.string()).default([]),
  dateStart: z.string().nullable().default(null),
  dateEnd: z.string().nullable().default(null)
});

export type FilterState = z.infer<typeof filterStateSchema>;

// Calendar date range
export const dateRangeSchema = z.object({
  start: z.string(),
  end: z.string()
});

export type DateRange = z.infer<typeof dateRangeSchema>;

// Legacy user types for storage compatibility
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
