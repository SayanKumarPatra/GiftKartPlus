import { memo, useEffect, useRef, useState } from 'react';
import { Gift } from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  aspectClass?: string;
  fit?: 'contain' | 'cover';
  zoomOnHover?: boolean;
  eager?: boolean;
  priority?: boolean;
}

export const ProductImage = memo(function ProductImage({
  src,
  alt,
  className = '',
  aspectClass = 'aspect-[4/3]',
  fit = 'contain',
  zoomOnHover = false,
  eager = false,
  priority = false,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isHighPriority = eager || priority;

  useEffect(() => {
    setFailed(false);
    // If image is already decoded in browser cache, mark loaded immediately (0ms flicker)
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`flex ${aspectClass} w-full flex-col items-center justify-center bg-gradient-to-br from-[#F7ECFF] via-[#FFF0F6] to-[#EBD8FF]/70 p-4 text-center ${className}`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-[#6A11CB] shadow-sm">
          <Gift className="h-5 w-5 text-[#FF4D8D]" />
        </div>
        <span className="mt-2 line-clamp-2 text-xs font-semibold text-[#6A11CB]">
          {alt}
        </span>
      </div>
    );
  }

  const fitClass =
    fit === 'cover'
      ? 'h-full w-full object-cover object-center'
      : 'h-full w-full max-h-full max-w-full object-contain object-center';

  const hoverClass =
    fit === 'cover' && zoomOnHover
      ? 'transition-transform duration-300 group-hover:scale-105'
      : '';

  return (
    <div
      className={`relative flex items-center justify-center ${aspectClass} w-full overflow-hidden bg-[#FAF7FD] ${className}`}
    >
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#F7ECFF] via-[#FDF5FA] to-[#EFE3FF]"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={isHighPriority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={isHighPriority ? 'high' : 'auto'}
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`${fitClass} transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${hoverClass}`}
      />
    </div>
  );
});
