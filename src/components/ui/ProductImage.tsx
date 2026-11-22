import { useState } from 'react';
import { Gift } from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  aspectClass?: string;
  zoomOnHover?: boolean;
}

export function ProductImage({
  src,
  alt,
  className = '',
  aspectClass = 'aspect-[4/3]',
  zoomOnHover = false,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

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

  return (
    <div className={`relative ${aspectClass} w-full overflow-hidden bg-[#FDF5FA] ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${
          zoomOnHover ? 'transition-transform duration-300 group-hover:scale-105' : ''
        }`}
      />
    </div>
  );
}
