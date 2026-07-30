/**
 * Camp photo urls point at /api/camp-image, which redirects to the photo's current Airtable url.
 * `size` picks an Airtable-generated thumbnail so a 46px square doesn't download the original.
 */
export type CampImageSize = "small" | "large" | "full";

export function campImageSrc(url: string, size: CampImageSize): string {
  if (size === "full") return url;
  return `${url}${url.includes("?") ? "&" : "?"}size=${size}`;
}
