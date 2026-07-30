import { useState } from "react";
import { ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { campImageSrc } from "@/lib/images";

const VISIBLE_THUMBS = 3;

interface CampImageHeaderProps {
  /** Used for image alt text. */
  campName: string;
  /** Airtable "Primary Image" URL. This component renders nothing if this is null. */
  imageUrl: string;
  /** Airtable "Gallery Images" URLs (already capped at 9 by the API layer). */
  galleryImages: string[];
  /**
   * Called with the index into the combined [primary, ...gallery] array
   * whenever the user clicks a photo, so the parent can open the lightbox.
   */
  onImageClick: (index: number) => void;
  /** Called when a photo fails to load, so the parent can drop it instead of showing it broken. */
  onImageError: (url: string) => void;
}

/**
 * Header photo cluster for the camp detail page: a primary image plus up to
 * 3 gallery thumbnails at a time, with left/right arrows to page through the
 * rest if there are more than 3 gallery images.
 *
 * Rendering rules (per product spec):
 *  - If there is no Primary Image, the parent never renders this component at all.
 *  - Gallery thumbnails only ever show if a Primary Image exists AND there is
 *    at least one Gallery Image.
 */
export function CampImageHeader({
  campName,
  imageUrl,
  galleryImages,
  onImageClick,
  onImageError,
}: CampImageHeaderProps) {
  const [scrollStart, setScrollStart] = useState(0);

  const hasGallery = galleryImages.length > 0;
  const canScrollLeft = scrollStart > 0;
  const canScrollRight = scrollStart + VISIBLE_THUMBS < galleryImages.length;
  // Clamped so removing a photo can't leave the row paged past the end and showing nothing.
  const start = Math.min(scrollStart, Math.max(0, galleryImages.length - VISIBLE_THUMBS));
  const visibleThumbs = galleryImages.slice(start, start + VISIBLE_THUMBS);

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0" data-testid="camp-image-header">
      <button
        type="button"
        onClick={() => onImageClick(0)}
        className="relative w-[130px] h-[76px] sm:w-[190px] sm:h-[110px] rounded-lg overflow-hidden border border-border/50 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-eggplant"
        aria-label={`View photo of ${campName}, opens larger view`}
        data-testid="button-primary-image"
      >
        <img
          src={campImageSrc(imageUrl, "large")}
          alt={`${campName} camp photo`}
          className="w-full h-full object-cover"
          onError={() => onImageError(imageUrl)}
        />
      </button>

      {hasGallery && (
        <div className="flex items-center gap-1">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => setScrollStart((s) => Math.max(0, s - VISIBLE_THUMBS))}
              aria-label="Show previous photos"
              className="p-1 rounded-full hover:bg-muted flex-shrink-0"
              data-testid="button-gallery-prev"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          <div className="flex gap-1.5">
            {visibleThumbs.map((url, i) => {
              const absoluteIndex = start + i + 1; // +1: index 0 is the primary image
              return (
                <button
                  key={`${url}-${absoluteIndex}`}
                  type="button"
                  onClick={() => onImageClick(absoluteIndex)}
                  className="w-[46px] h-[62px] sm:w-[64px] sm:h-[86px] rounded-md overflow-hidden border border-border/50 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-eggplant"
                  aria-label={`View ${campName} photo ${absoluteIndex + 1}, opens larger view`}
                  data-testid={`button-gallery-thumb-${i}`}
                >
                  <img
                    // Airtable's "small" thumbnail is only 24x36px - far too little for a 64x86
                    // box on a retina screen. "large" is 512px on the long edge and still ~66KB.
                    src={campImageSrc(url, "large")}
                    alt={`${campName} camp photo ${absoluteIndex + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => onImageError(url)}
                  />
                </button>
              );
            })}
          </div>

          {canScrollRight && (
            <button
              type="button"
              onClick={() => setScrollStart((s) => s + VISIBLE_THUMBS)}
              aria-label="Show more photos"
              className="p-1 rounded-full hover:bg-muted flex-shrink-0"
              data-testid="button-gallery-next"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Small camera glyph, exported in case an empty/no-photo state is wanted elsewhere later. */
export function CampImagePlaceholderIcon({ className }: { className?: string }) {
  return <Camera className={className} />;
}
