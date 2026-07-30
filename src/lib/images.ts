/**
 * Camp photo urls point at /api/camp-image, which redirects to the photo's current Airtable url.
 * `size` picks an Airtable-generated thumbnail instead of the original.
 *
 * Airtable's variants are fixed: small is 24x36px (too small for anything we display), large is
 * 512px on the long edge at roughly 66KB, and full is the untouched upload (often 1400x2000+).
 */
export type CampImageSize = "small" | "large" | "full";

export function campImageSrc(url: string, size: CampImageSize): string {
  if (size === "full") return url;
  return `${url}${url.includes("?") ? "&" : "?"}size=${size}`;
}
