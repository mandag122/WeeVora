import { z } from "zod";

// Camp category types
export const campCategories = [
  "Sports & Athletics",
  "Arts & Crafts", 
  "STEM & Technology",
  "Performing Arts",
  "Outdoor & Nature",
  "Academic",
  "Park District",
  "Multi-Activity"
] as const;

export type CampCategory = typeof campCategories[number];

// Category colors for visual distinction
export const categoryColors: Record<CampCategory, string> = {
  "Sports & Athletics": "#558B2F",
  "Arts & Crafts": "#FF7043",
  "STEM & Technology": "#117A8B",
  "Performing Arts": "#C2395A",
  "Outdoor & Nature": "#4A8B6F",
  "Academic": "#5B2C6F",
  "Park District": "#117A8B",
  "Multi-Activity": "#3D4AA3"
};

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
  additionalInfo: z.string().nullable()
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
  extendedHoursOnly: z.boolean().default(false)
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
