import { Link } from 'react-router-dom';
import { Headphones, Sparkles } from 'lucide-react';
import { useStoreSettings } from '../../hooks/useStoreData';
import { useLanguage } from '../../context/LanguageContext';
import { autoTranslateToBengali } from '../../i18n/bengaliAutoTranslate';

export function AnnouncementBar() {
  const { data: settings } = useStoreSettings();
  const { language, t } = useLanguage();
  const announcement = settings?.announcement;

  if (announcement && !announcement.enabled) {
    return null;
  }

  const rawDesktopText =
    announcement?.desktopText ??
    'Delivery in Jalchak • Customization Available';
  const desktopText =
    language === 'bn'
      ? rawDesktopText === 'Delivery in Jalchak • Customization Available'
        ? 'জলচক-এ ডেলিভারি • কাস্টমাইজেশন উপলব্ধ'
        : autoTranslateToBengali(rawDesktopText)
      : rawDesktopText;
  const showSupport = announcement?.showSupportLink ?? true;

  return (
    <div
      role="region"
      aria-label="Store announcements"
      className="hidden w-full rounded-none bg-gradient-to-r from-[#6A11CB] via-[#8A2BE2] to-[#FF4D8D] text-white lg:block"
    >
      <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-4 px-6 text-xs font-semibold">
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
              <span>{t('footerSupport')}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
