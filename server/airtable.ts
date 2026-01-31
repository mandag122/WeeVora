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

// Based on actual Airtable field names from the Camps table
interface AirtableCampFields {
  "Camp Name"?: string;
  "Organization"?: string;
  "Description"?: string;
  "Interests"?: string[];
  "Age Group"?: string;
  "Location"?: string;
  "Location City"?: string;
  "Price Min"?: number;
  "Price Max"?: number;
  "Registration Opens"?: string;
  "Registration Closes"?: string;
  "Start Date"?: string;
  "End Date"?: string;
  "camp_hours"?: string;
  "extended_hours"?: string;
  "Is Registration Open?"?: string;
  "Waitlist Only"?: boolean;
  "Sibling Discount"?: string;
  "Website"?: string;
  "Color"?: string;
  "Additional Info"?: string;
  "camp_id"?: number;
  "Registration_Options"?: string[];
}

// Based on actual Airtable field names from Registration_Options table
interface AirtableRegistrationFields {
  "option_name"?: string;
  "Camps"?: string[];
  "Camp Name (from Camps 2)"?: string[];
  "dates_csv"?: string;
  "price"?: string;
  "extended_price"?: string;
  "age_min"?: number;
  "age_max"?: number;
  "registration_opens"?: string;
  "registration_closes"?: string;
  "waitlist_only"?: boolean;
  "color"?: string;
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

function generateSlug(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return base || id;
}

// Parse age group string like "5-12" or "4-12" into min/max
function parseAgeGroup(ageGroup: string | undefined): { min: number | null; max: number | null } {
  if (!ageGroup) return { min: null, max: null };
  
  const match = ageGroup.match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    return { min: parseInt(match[1]), max: parseInt(match[2]) };
  }
  
  const singleMatch = ageGroup.match(/(\d+)\+?/);
  if (singleMatch) {
    return { min: parseInt(singleMatch[1]), max: null };
  }
  
  return { min: null, max: null };
}

// Map Airtable "Interests" to our category names
function mapInterestsToCategories(interests: string[] | undefined): string[] {
  if (!interests) return [];
  
  const categoryMap: Record<string, string> = {
    "Sports": "Sports & Athletics",
    "Arts": "Arts & Crafts",
    "STEM": "STEM & Technology",
    "Technology": "STEM & Technology",
    "Science": "STEM & Technology",
    "Performing Arts": "Performing Arts",
    "Theater": "Performing Arts",
    "Music": "Performing Arts",
    "Dance": "Performing Arts",
    "Outdoor": "Outdoor & Nature",
    "Nature": "Outdoor & Nature",
    "Adventure": "Outdoor & Nature",
    "Academic": "Academic",
    "Education": "Academic",
    "Multi-Activity": "Multi-Activity",
    "Other": "Multi-Activity"
  };
  
  const mapped = interests.map(interest => categoryMap[interest] || interest);
  return Array.from(new Set(mapped)); // Remove duplicates
}

export async function fetchCamps(): Promise<Camp[]> {
  try {
    const records = await fetchFromAirtable<AirtableCampFields>("Camps");
    const ages = records.map(r => parseAgeGroup(r.fields["Age Group"]));
    
    return records.map((record, index) => ({
      id: record.id,
      name: record.fields["Camp Name"] || "Unnamed Camp",
      slug: generateSlug(record.fields["Camp Name"] || "", record.id),
      organization: record.fields.Organization || null,
      description: record.fields.Description || null,
      categories: mapInterestsToCategories(record.fields.Interests),
      ageMin: ages[index].min,
      ageMax: ages[index].max,
      locationCity: record.fields["Location City"] || null,
      locationAddress: record.fields.Location || null,
      priceMin: record.fields["Price Min"] ?? null,
      priceMax: record.fields["Price Max"] ?? null,
      registrationOpens: record.fields["Registration Opens"] || null,
      registrationCloses: record.fields["Registration Closes"] || null,
      seasonStart: record.fields["Start Date"] || null,
      seasonEnd: record.fields["End Date"] || null,
      campHours: record.fields.camp_hours || null,
      extendedHours: !!record.fields.extended_hours,
      extendedHoursInfo: record.fields.extended_hours || null,
      waitlistOnly: record.fields["Waitlist Only"] || false,
      siblingDiscountNote: record.fields["Sibling Discount"] || null,
      websiteUrl: record.fields.Website || null,
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
    const results: RegistrationOption[] = [];
    
    for (const record of records) {
      const campId = record.fields.Camps?.[0] || "";
      const optionNames = record.fields.option_name?.split(",").map(s => s.trim()) || ["Session"];
      const datesCsv = record.fields.dates_csv?.split(",").map(s => s.trim()) || [];
      const prices = record.fields.price?.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n)) || [];
      const extendedPrices = record.fields.extended_price?.split(",").map(s => parseFloat(s.trim())).filter(n => !isNaN(n)) || [];
      
      // Create a registration option for each session in the CSV
      optionNames.forEach((name, idx) => {
        const dateRange = datesCsv[idx] || "";
        const [startStr, endStr] = dateRange.split("-").map(s => s.trim());
        
        // Parse dates from MM/DD/YYYY format
        let startDate: string | null = null;
        let endDate: string | null = null;
        
        if (startStr) {
          const [month, day, year] = startStr.split("/");
          if (month && day && year) {
            startDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          }
        }
        if (endStr) {
          const [month, day, year] = endStr.split("/");
          if (month && day && year) {
            endDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          }
        }
        
        results.push({
          id: `${record.id}-${idx}`,
          campId,
          sessionName: name || `Session ${idx + 1}`,
          startDate,
          endDate,
          price: prices[idx] ?? null,
          extendedPrice: extendedPrices[idx] ?? null,
          ageMin: record.fields.age_min ?? null,
          ageMax: record.fields.age_max ?? null,
          registrationOpens: record.fields.registration_opens || null,
          registrationCloses: record.fields.registration_closes || null,
          waitlistOnly: record.fields.waitlist_only || false,
          color: record.fields.color || null
        });
      });
    }
    
    return results;
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

// Submit contact form to Airtable Feedback table
export async function submitContactForm(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<boolean> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error("Airtable credentials not configured");
    return false;
  }

  try {
    const response = await fetch(`${AIRTABLE_API_URL}/Feedback`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        records: [{
          fields: {
            Name: data.name,
            Email: data.email,
            Subject: data.subject || "",
            Message: data.message
          }
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Airtable submit error: ${response.status} - ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error submitting to Airtable:", error);
    return false;
  }
}
