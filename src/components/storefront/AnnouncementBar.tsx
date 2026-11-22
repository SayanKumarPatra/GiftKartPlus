import { Link } from 'react-router-dom';
import { Headphones, MapPin, PackageSearch, Sparkles } from 'lucide-react';
import { useStoreSettings } from '../../hooks/useStoreData';

export function AnnouncementBar() {
  const { data: settings } = useStoreSettings();
  const announcement = settings?.announcement;

  if (announcement && !announcement.enabled) {
    return null;
  }

  const desktopText =
    announcement?.desktopText ??
    'Delivery in Jalchak • Customization Available • Demo Orders Only (No COD)';
  const mobileText =
    announcement?.mobileText ?? 'Serving Jalchak | Demo Orders Only';
  const showSupport = announcement?.showSupportLink ?? true;
  const showTrack = announcement?.showTrackOrderLink ?? true;

  return (
    <div
      role="region"
      aria-label="Store announcements"
      className="w-full rounded-none bg-gradient-to-r from-[#6A11CB] via-[#8A2BE2] to-[#FF4D8D] text-white"
    >
      {/* Desktop Announcement Bar */}
      <div className="mx-auto hidden h-8 max-w-7xl items-center justify-between gap-4 px-6 text-xs font-semibold lg:flex">
        <div className="flex items-center gap-2 truncate">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#FFE1EF]" />
          <span className="truncate">{desktopText}</span>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {showSupport && (
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 text-white/95 transition-opacity hover:opacity-80"
            >
              <Headphones className="h-3.5 w-3.5" />
              <span>Customer Support</span>
            </Link>
          )}
          {showTrack && (
            <Link
              to="/track-order"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-white transition-colors hover:bg-white/25"
            >
              <PackageSearch className="h-3.5 w-3.5" />
              <span>Track Order</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Full-Width Edge-to-Edge Announcement Strip */}
      <div className="flex h-7 w-full items-center justify-center gap-1.5 px-3 text-center text-[11px] font-semibold lg:hidden">
        <MapPin className="h-3 w-3 shrink-0 text-[#FFE1EF]" />
        <span className="truncate">{mobileText}</span>
      </div>
    </div>
  );
}
