import type { Camp, RegistrationOption } from "@shared/schema";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

interface AirtableResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

interface AirtableCampFields {
  Name?: string;
  Slug?: string;
  Organization?: string;
  Description?: string;
  Categories?: string[];
  "Age Min"?: number;
  "Age Max"?: number;
  "Location City"?: string;
  "Location Address"?: string;
  "Price Min"?: number;
  "Price Max"?: number;
  "Registration Opens"?: string;
  "Registration Closes"?: string;
  "Season Start"?: string;
  "Season End"?: string;
  "Camp Hours"?: string;
  "Extended Hours"?: boolean;
  "Extended Hours Info"?: string;
  "Waitlist Only"?: boolean;
  "Sibling Discount Note"?: string;
  "Website URL"?: string;
  Color?: string;
  "Additional Info"?: string;
}

interface AirtableRegistrationFields {
  "Session Name"?: string;
  Camp?: string[];
  "Start Date"?: string;
  "End Date"?: string;
  Price?: number;
  "Age Min"?: number;
  "Age Max"?: number;
  "Registration Opens"?: string;
  "Registration Closes"?: string;
  "Waitlist Only"?: boolean;
  Color?: string;
}

async function fetchFromAirtable<T>(tableName: string): Promise<AirtableRecord<T>[]> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error("Airtable credentials not configured");
    return [];
  }

  const allRecords: AirtableRecord<T>[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`${AIRTABLE_API_URL}/${encodeURIComponent(tableName)}`);
    if (offset) {
      url.searchParams.set("offset", offset);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Airtable API error: ${response.status} - ${errorText}`);
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data: AirtableResponse<T> = await response.json();
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function fetchCamps(): Promise<Camp[]> {
  try {
    const records = await fetchFromAirtable<AirtableCampFields>("Camps");
    
    return records.map(record => ({
      id: record.id,
      name: record.fields.Name || "Unnamed Camp",
      slug: record.fields.Slug || generateSlug(record.fields.Name || record.id),
      organization: record.fields.Organization || null,
      description: record.fields.Description || null,
      categories: record.fields.Categories || [],
      ageMin: record.fields["Age Min"] ?? null,
      ageMax: record.fields["Age Max"] ?? null,
      locationCity: record.fields["Location City"] || null,
      locationAddress: record.fields["Location Address"] || null,
      priceMin: record.fields["Price Min"] ?? null,
      priceMax: record.fields["Price Max"] ?? null,
      registrationOpens: record.fields["Registration Opens"] || null,
      registrationCloses: record.fields["Registration Closes"] || null,
      seasonStart: record.fields["Season Start"] || null,
      seasonEnd: record.fields["Season End"] || null,
      campHours: record.fields["Camp Hours"] || null,
      extendedHours: record.fields["Extended Hours"] || false,
      extendedHoursInfo: record.fields["Extended Hours Info"] || null,
      waitlistOnly: record.fields["Waitlist Only"] || false,
      siblingDiscountNote: record.fields["Sibling Discount Note"] || null,
      websiteUrl: record.fields["Website URL"] || null,
      color: record.fields.Color || null,
      additionalInfo: record.fields["Additional Info"] || null
    }));
  } catch (error) {
    console.error("Error fetching camps from Airtable:", error);
    return [];
  }
}

export async function fetchRegistrationOptions(): Promise<RegistrationOption[]> {
  try {
    const records = await fetchFromAirtable<AirtableRegistrationFields>("Registration_Options");
    
    return records.map(record => ({
      id: record.id,
      campId: record.fields.Camp?.[0] || "",
      sessionName: record.fields["Session Name"] || "Session",
      startDate: record.fields["Start Date"] || null,
      endDate: record.fields["End Date"] || null,
      price: record.fields.Price ?? null,
      ageMin: record.fields["Age Min"] ?? null,
      ageMax: record.fields["Age Max"] ?? null,
      registrationOpens: record.fields["Registration Opens"] || null,
      registrationCloses: record.fields["Registration Closes"] || null,
      waitlistOnly: record.fields["Waitlist Only"] || false,
      color: record.fields.Color || null
    }));
  } catch (error) {
    console.error("Error fetching registration options from Airtable:", error);
    return [];
  }
}

export async function getCampBySlug(slug: string): Promise<Camp | null> {
  const camps = await fetchCamps();
  return camps.find(camp => camp.slug === slug) || null;
}

export async function getSessionsForCamp(campId: string): Promise<RegistrationOption[]> {
  const allSessions = await fetchRegistrationOptions();
  return allSessions.filter(session => session.campId === campId);
}

export async function getSimilarCamps(camp: Camp, limit: number = 4): Promise<Camp[]> {
  const allCamps = await fetchCamps();
  
  const similar = allCamps
    .filter(c => c.id !== camp.id)
    .filter(c => {
      const hasOverlappingCategory = c.categories.some(cat => 
        camp.categories.includes(cat)
      );
      const hasOverlappingAge = 
        c.ageMin !== null && c.ageMax !== null &&
        camp.ageMin !== null && camp.ageMax !== null &&
        c.ageMin <= (camp.ageMax ?? 18) && c.ageMax >= (camp.ageMin ?? 0);
      
      return hasOverlappingCategory || hasOverlappingAge;
    })
    .sort((a, b) => {
      const aHasReg = !!a.registrationOpens || !!a.registrationCloses;
      const bHasReg = !!b.registrationOpens || !!b.registrationCloses;
      if (aHasReg && !bHasReg) return -1;
      if (!aHasReg && bHasReg) return 1;
      return 0;
    })
    .slice(0, limit);
  
  return similar;
}
