import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  getLocalizedEntityField,
  translateCategoryLabel,
  translateOccasionLabel,
  type LanguageCode,
  type LanguageOption,
  type TranslationKey,
} from '../i18n/translations';
import {
  formatLocalizedDate,
  translateOrderStatusLabel,
  translatePaymentMethodLabel,
  translatePaymentStatusLabel,
  translatePlaceText,
  translateVariantText,
} from '../i18n/bengaliAutoTranslate';
import { readStorage, STORAGE_KEYS, writeStorage } from '../storage/localStorageEngine';
import { useAuth } from './AuthContext';
import type { LocalizedEntityText } from '../types';

interface LanguageContextValue {
  language: LanguageCode;
  languages: LanguageOption[];
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey) => string;
  translateCategory: (
    name: string,
    translations?: Partial<Record<LanguageCode, LocalizedEntityText>>
  ) => string;
  translateOccasion: (occasion: string) => string;
  localizeEntity: (
    fallback: string,
    field: keyof LocalizedEntityText,
    translations?: Partial<Record<LanguageCode, LocalizedEntityText>>
  ) => string;
  translateOrderStatus: (status: string) => string;
  translatePaymentStatus: (status: string) => string;
  translatePaymentMethod: (method: string) => string;
  translateVariant: (text: string) => string;
  translatePlace: (text: string) => string;
  formatDate: (iso?: string, options?: Intl.DateTimeFormatOptions) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isValidLanguage(value: unknown): value is LanguageCode {
  return value === 'en' || value === 'bn' || value === 'hi';
}

function readSavedLanguage(): LanguageCode {
  const stored = readStorage<string>(STORAGE_KEYS.LANGUAGE, DEFAULT_LANGUAGE);
  return isValidLanguage(stored) ? stored : DEFAULT_LANGUAGE;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { customerAccount } = useAuth();
  const [language, setLanguageState] = useState<LanguageCode>(() => readSavedLanguage());

  // Sync per-user saved language preference when a registered user signs in
  useEffect(() => {
    const email = customerAccount?.email?.trim().toLowerCase();
    if (!email) return;
    const map = readStorage<Record<string, LanguageCode>>(STORAGE_KEYS.USER_LANGUAGES, {});
    const userPref = map[email];
    if (isValidLanguage(userPref) && userPref !== language) {
      setLanguageState(userPref);
      try {
        writeStorage(STORAGE_KEYS.LANGUAGE, userPref);
      } catch {
        // Ignore storage write errors
      }
    }
  }, [customerAccount?.email]);

  // Keep <html lang="..."> and .lang-bn (Tiro Bangla font switch) updated instantly without reload
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.classList.toggle('lang-bn', language === 'bn');
    }
  }, [language]);

  const setLanguage = useCallback(
    (nextLang: LanguageCode) => {
      if (!isValidLanguage(nextLang)) return;
      setLanguageState(nextLang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = nextLang;
        document.documentElement.classList.toggle('lang-bn', nextLang === 'bn');
      }
      try {
        writeStorage(STORAGE_KEYS.LANGUAGE, nextLang);
        const email = customerAccount?.email?.trim().toLowerCase();
        if (email) {
          const map = readStorage<Record<string, LanguageCode>>(STORAGE_KEYS.USER_LANGUAGES, {});
          writeStorage(STORAGE_KEYS.USER_LANGUAGES, {
            ...map,
            [email]: nextLang,
          });
        }
      } catch {
        // Ignore storage write errors in restricted browsing modes
      }
    },
    [customerAccount?.email]
  );

  const t = useCallback(
    (key: TranslationKey): string => {
      return TRANSLATIONS[language][key] ?? TRANSLATIONS.en[key];
    },
    [language]
  );

  const translateCategory = useCallback(
    (name: string, translations?: Partial<Record<LanguageCode, LocalizedEntityText>>) =>
      translateCategoryLabel(name, language, translations),
    [language]
  );

  const translateOccasion = useCallback(
    (occasion: string) => translateOccasionLabel(occasion, language),
    [language]
  );

  const localizeEntity = useCallback(
    (
      fallback: string,
      field: keyof LocalizedEntityText,
      translations?: Partial<Record<LanguageCode, LocalizedEntityText>>
    ) => getLocalizedEntityField(fallback, field, language, translations),
    [language]
  );

  const translateOrderStatus = useCallback(
    (status: string) => translateOrderStatusLabel(status, language),
    [language]
  );

  const translatePaymentStatus = useCallback(
    (status: string) => translatePaymentStatusLabel(status, language),
    [language]
  );

  const translatePaymentMethod = useCallback(
    (method: string) => translatePaymentMethodLabel(method, language),
    [language]
  );

  const translateVariant = useCallback(
    (text: string) => translateVariantText(text, language),
    [language]
  );

  const translatePlace = useCallback(
    (text: string) => translatePlaceText(text, language),
    [language]
  );

  const formatDate = useCallback(
    (iso?: string, options?: Intl.DateTimeFormatOptions) =>
      formatLocalizedDate(iso, language, options),
    [language]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      languages: SUPPORTED_LANGUAGES,
      setLanguage,
      t,
      translateCategory,
      translateOccasion,
      localizeEntity,
      translateOrderStatus,
      translatePaymentStatus,
      translatePaymentMethod,
      translateVariant,
      translatePlace,
      formatDate,
    }),
    [
      language,
      setLanguage,
      t,
      translateCategory,
      translateOccasion,
      localizeEntity,
      translateOrderStatus,
      translatePaymentStatus,
      translatePaymentMethod,
      translateVariant,
      translatePlace,
      formatDate,
    ]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return ctx;
}
