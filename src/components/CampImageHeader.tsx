import { useState } from "react";
import { ChevronLeft, ChevronRight, Camera } from "lucide-react";

const VISIBLE_THUMBS = 3;

interface CampImageHeaderProps {
  /** Airtable "Primary Image" URL. This component renders nothing if this is null. */
  imageUrl: string;
  /** Airtable "Gallery Images" URLs (already capped at 9 by the API layer). */
  galleryImages: string[];
  /**
   * Called with the index into the combined [primary, ...gallery] array
   * whenever the user clicks a photo, so the parent can open the lightbox.
   */
  onImageClick: (index: number) => void;
}

/**
 * Header photo cluster for the camp detail page.
 *
 * Desktop (sm+): primary image plus up to 3 gallery thumbnails at a time,
 * with left/right arrows to page through the rest if there are more than 3.
 *
 * Mobile: a single primary-sized image on the right with optional side
 * chevrons to cycle through primary + gallery. Click still opens lightbox.
 * Gallery thumbnails are hidden so the title card alignment stays clean.
 *
 * Rendering rules (per product spec):
 *  - If there is no Primary Image, the parent never renders this component at all.
 *  - Gallery thumbnails (desktop) only ever show if a Primary Image exists AND
 *    there is at least one Gallery Image.
 */
export function CampImageHeader({ imageUrl, galleryImages, onImageClick }: CampImageHeaderProps) {
  const [scrollStart, setScrollStart] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);

  const allImages = [imageUrl, ...galleryImages];
  const hasGallery = galleryImages.length > 0;
  const canScrollLeft = scrollStart > 0;
  const canScrollRight = scrollStart + VISIBLE_THUMBS < galleryImages.length;
  const visibleThumbs = galleryImages.slice(scrollStart, scrollStart + VISIBLE_THUMBS);

  const mobileCount = allImages.length;
  const safeMobileIndex = ((mobileIndex % mobileCount) + mobileCount) % mobileCount;
  const mobileImage = allImages[safeMobileIndex];
  const canCycleMobile = mobileCount > 1;

  const cycleMobile = (delta: number) => {
    setMobileIndex((i) => {
      const next = ((i + delta) % mobileCount + mobileCount) % mobileCount;
      return next;
    });
  };

  return (
    <div
      className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto"
      data-testid="camp-image-header"
    >
      {/* Mobile: single image + optional side chevrons */}
      <div className="flex items-center gap-1 sm:hidden">
        {canCycleMobile && (
          <button
            type="button"
            onClick={() => cycleMobile(-1)}
            aria-label="Show previous photo"
            className="p-1 rounded-full hover:bg-muted flex-shrink-0"
            data-testid="button-mobile-gallery-prev"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onImageClick(safeMobileIndex)}
          className="relative w-[130px] h-[76px] rounded-lg overflow-hidden border border-border/50 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-eggplant"
          aria-label="View camp photo, opens larger view"
          data-testid="button-primary-image-mobile"
        >
          <img src={mobileImage} alt="" className="w-full h-full object-cover" loading="lazy" />
        </button>

        {canCycleMobile && (
          <button
            type="button"
            onClick={() => cycleMobile(1)}
            aria-label="Show next photo"
            className="p-1 rounded-full hover:bg-muted flex-shrink-0"
            data-testid="button-mobile-gallery-next"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Desktop (sm+): primary + gallery thumbs */}
      <div className="hidden sm:flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => onImageClick(0)}
          className="relative w-[190px] h-[110px] rounded-lg overflow-hidden border border-border/50 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-eggplant"
          aria-label="View camp photo, opens larger view"
          data-testid="button-primary-image"
        >
          <img src={imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
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
                const absoluteIndex = scrollStart + i + 1; // +1: index 0 is the primary image
                return (
                  <button
                    key={`${url}-${absoluteIndex}`}
                    type="button"
                    onClick={() => onImageClick(absoluteIndex)}
                    className="w-[64px] h-[86px] rounded-md overflow-hidden border border-border/50 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-eggplant"
                    aria-label={`View camp photo ${absoluteIndex + 1}, opens larger view`}
                    data-testid={`button-gallery-thumb-${i}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
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
    </div>
  );
}

/** Small camera glyph, exported in case an empty/no-photo state is wanted elsewhere later. */
export function CampImagePlaceholderIcon({ className }: { className?: string }) {
  return <Camera className={className} />;
}
