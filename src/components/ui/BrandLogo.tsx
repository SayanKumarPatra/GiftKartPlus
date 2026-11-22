import { useState } from 'react';
import { Gift } from 'lucide-react';
import { BRAND_ASSETS } from '../../config/appConfig';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function BrandLogo({ size = 'md', showTagline = false }: BrandLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const heightClass =
    size === 'sm' ? 'h-9 sm:h-10' : size === 'lg' ? 'h-14' : 'h-11 sm:h-12';

  return (
    <span className="inline-flex flex-col items-start whitespace-nowrap shrink-0">
      {!imgFailed ? (
        <img
          src={BRAND_ASSETS.logo}
          alt="GiftKart — Har Gift Mein Ek Kahani."
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className={`${heightClass} w-auto max-w-[200px] object-contain select-none`}
        />
      ) : (
        <span className="inline-flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #6A11CB 0%, #FF4D8D 100%)' }}
          >
            <Gift className="h-4 w-4" />
          </span>
          <span className="flex flex-col">
            <span className="text-xl font-extrabold leading-none tracking-tight text-[#6A11CB]">
              Gift<span className="text-[#FF4D8D]">Kart</span>
            </span>
            {showTagline && (
              <span className="mt-0.5 text-[10px] font-semibold tracking-wide text-[#6A11CB]/80">
                Har Gift Mein Ek Kahani.
              </span>
            )}
          </span>
        </span>
      )}
    </span>
  );
}
