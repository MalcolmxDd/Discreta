import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
  images?: string[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export default function ImageLightbox({ src, alt, onClose, images, currentIndex = 0, onNavigate }: Props) {
  const [imgError, setImgError] = useState(false);
  const hasGallery = !!images && images.length > 1 && !!onNavigate;

  const goNext = useCallback(() => {
    if (hasGallery && currentIndex < images!.length - 1) {
      onNavigate!(currentIndex + 1);
      setImgError(false);
    }
  }, [hasGallery, currentIndex, images, onNavigate]);

  const goPrev = useCallback(() => {
    if (hasGallery && currentIndex > 0) {
      onNavigate!(currentIndex - 1);
      setImgError(false);
    }
  }, [hasGallery, currentIndex, onNavigate]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    },
    [onClose, goNext, goPrev]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  // Reset imgError when src changes
  useEffect(() => {
    setImgError(false);
  }, [src]);

  return (
    <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-label="Vista ampliada">
      <button className="lightbox-close" onClick={onClose} aria-label="Cerrar">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Navigation arrows */}
      {hasGallery && currentIndex > 0 && (
        <button
          className="lightbox-nav lightbox-nav-prev"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label="Imagen anterior"
        >
          <ChevronLeft size={28} />
        </button>
      )}
      {hasGallery && currentIndex < images!.length - 1 && (
        <button
          className="lightbox-nav lightbox-nav-next"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label="Imagen siguiente"
        >
          <ChevronRight size={28} />
        </button>
      )}

      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {imgError ? (
          <div style={{ width: "100%", height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            No se pudo cargar la imagen
          </div>
        ) : (
          <img src={src} alt={alt} className="lightbox-image" onError={() => setImgError(true)} />
        )}
      </div>

      <p className="lightbox-caption">
        {alt}
        {hasGallery && <> · {currentIndex + 1}/{images!.length}</>}
      </p>
    </div>
  );
}
