import { useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageLightboxProps {
  /** Combined [primaryImage, ...galleryImages] array, up to 10 total. */
  images: string[];
  /** Index currently open, or null when the lightbox should be closed. */
  index: number | null;
  onIndexChange: (index: number | null) => void;
}

/**
 * Fullscreen photo viewer ("second window enlarged") opened by clicking any
 * camp photo. Supports left/right arrow buttons and arrow-key navigation to
 * cycle through every photo for the camp.
 */
export function ImageLightbox({ images, index, onIndexChange }: ImageLightboxProps) {
  const open = index !== null && images.length > 0;

  const goTo = useCallback(
    (next: number) => {
      const wrapped = ((next % images.length) + images.length) % images.length;
      onIndexChange(wrapped);
    },
    [images.length, onIndexChange]
  );

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goTo((index as number) + 1);
      if (e.key === "ArrowLeft") goTo((index as number) - 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, index, goTo]);

  if (!open) return null;

  const current = images[index as number];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onIndexChange(null)}>
      <DialogContent
        className="max-w-4xl w-[95vw] bg-black/95 border-none p-2 sm:p-4"
        data-testid="dialog-image-lightbox"
      >
        <div className="relative flex items-center justify-center min-h-[40vh]">
          {images.length > 1 && (
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => goTo((index as number) - 1)}
              className="absolute left-1 sm:left-2 z-10 p-2 rounded-full bg-white/90 hover:bg-white text-eggplant shadow"
              data-testid="button-lightbox-prev"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <img
            src={current}
            alt=""
            className="max-h-[80vh] max-w-full rounded-md object-contain"
            data-testid="img-lightbox-current"
          />

          {images.length > 1 && (
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => goTo((index as number) + 1)}
              className="absolute right-1 sm:right-2 z-10 p-2 rounded-full bg-white/90 hover:bg-white text-eggplant shadow"
              data-testid="button-lightbox-next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {images.length > 1 && (
          <p className="text-center text-xs text-white/70 mt-1" data-testid="text-lightbox-counter">
            {(index as number) + 1} / {images.length}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
