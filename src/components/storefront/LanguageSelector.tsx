import { Check, Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { TRANSLATIONS, type LanguageCode } from '../../i18n/translations';

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSelector({
  compact = false,
  className = '',
}: LanguageSelectorProps) {
  const { language, languages, setLanguage, t } = useLanguage();
  const { pushToast } = useToast();

  function handleSelect(code: LanguageCode) {
    if (code === language) return;
    setLanguage(code);
    const chosen = languages.find((item) => item.code === code);
    const updatedLabel = TRANSLATIONS[code].languageUpdated;
    pushToast({
      title: chosen ? `${updatedLabel}: ${chosen.nativeName}` : updatedLabel,
      variant: 'success',
      compact: true,
    });
  }

  if (compact) {
    return (
      <div
        className={`rounded-2xl border border-[#EBD8FF] bg-white p-3 shadow-[0_6px_18px_-12px_rgba(106,17,203,0.18)] ${className}`}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-[#6A11CB]" />
            <span className="text-[12px] font-bold text-[#2B0B4E]">
              {t('appLanguage')}
            </span>
          </div>
          <span
            className={`text-[11.5px] font-semibold text-[#6A11CB] ${
              language === 'bn' ? 'font-tiro-bangla' : ''
            }`}
          >
            {languages.find((l) => l.code === language)?.nativeName}
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label={t('chooseLanguage')}
          className="grid grid-cols-3 gap-1.5"
        >
          {languages.map((option) => {
            const active = option.code === language;
            return (
              <button
                key={option.code}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => handleSelect(option.code)}
                className={`flex min-h-[40px] cursor-pointer items-center justify-center gap-1 rounded-xl border px-1.5 text-[12.5px] font-bold transition-all active:scale-[0.97] ${
                  option.code === 'bn' ? 'font-tiro-bangla' : ''
                } ${
                  active
                    ? 'border-[#6A11CB] bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] text-white shadow-[0_6px_14px_-8px_rgba(106,17,203,0.55)]'
                    : 'border-[#EBD8FF] bg-[#FAF6FF] text-[#2B0B4E] hover:border-[#6A11CB]/50 hover:bg-[#F3E8FF]'
                }`}
              >
                <span>{option.nativeName}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0 stroke-[2.6]" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-start gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6A11CB] to-[#FF4D8D] text-white shadow-xs">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-[17px] font-bold text-[#2B0B4E]">
            {t('chooseLanguage')}
          </h2>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#6E5B85]">
            {t('languageSubtitle')}
          </p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label={t('chooseLanguage')}
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
      >
        {languages.map((option) => {
          const active = option.code === language;
          return (
            <button
              key={option.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => handleSelect(option.code)}
              className={`group flex min-h-[58px] cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.985] ${
                active
                  ? 'border-[#6A11CB] bg-gradient-to-br from-[#FAF5FF] to-[#FFF0F6] shadow-[0_10px_22px_-14px_rgba(106,17,203,0.45)] ring-1 ring-[#6A11CB]/25'
                  : 'border-[#EBD8FF] bg-white hover:border-[#6A11CB]/45 hover:bg-[#FCFAFF]'
              }`}
            >
              <div className="min-w-0">
                <p
                  className={`text-[16px] font-extrabold leading-tight ${
                    option.code === 'bn' ? 'font-tiro-bangla' : ''
                  } ${active ? 'text-[#6A11CB]' : 'text-[#2B0B4E]'}`}
                >
                  {option.nativeName}
                </p>
                <p className="mt-0.5 text-[11.5px] font-medium text-[#6E5B85]">
                  {option.englishName}
                </p>
              </div>

              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  active
                    ? 'border-[#6A11CB] bg-[#6A11CB] text-white'
                    : 'border-[#D9C6EE] bg-[#FAF6FF] text-transparent group-hover:border-[#6A11CB]/50'
                }`}
              >
                <Check className="h-3.5 w-3.5 stroke-[2.8]" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
