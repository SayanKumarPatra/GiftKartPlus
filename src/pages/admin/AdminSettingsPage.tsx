import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Info,
  Phone,
  Save,
  Search,
  Settings,
  Share2,
  Shield,
  Upload,
} from 'lucide-react';
import { useStoreSettings } from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import type { StoreSettings } from '../../types';
import {
  AdminToast,
  AdminToggleSwitch,
  readImageFileAsDataUrl,
} from '../../components/admin/AdminSharedUI';

type SettingsSectionId =
  | 'general'
  | 'contact'
  | 'social'
  | 'seo'
  | 'about'
  | 'policies'
  | 'footer';

const SETTINGS_GROUPS: {
  id: SettingsSectionId;
  title: string;
  subtitle: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'general',
    title: 'General Settings',
    subtitle: 'Website name, logo & maintenance mode',
    Icon: Settings,
  },
  {
    id: 'contact',
    title: 'Contact Information',
    subtitle: 'Support email, phone & service area',
    Icon: Phone,
  },
  {
    id: 'social',
    title: 'Social Media Links',
    subtitle: 'Instagram, Facebook, WhatsApp & YouTube',
    Icon: Share2,
  },
  {
    id: 'seo',
    title: 'SEO Settings',
    subtitle: 'Search engine title & meta description',
    Icon: Search,
  },
  {
    id: 'about',
    title: 'About Page',
    subtitle: 'Store story & brand headline',
    Icon: Info,
  },
  {
    id: 'policies',
    title: 'Policy Pages',
    subtitle: 'Privacy, Terms & Conditions, Refund Policy',
    Icon: Shield,
  },
  {
    id: 'footer',
    title: 'Footer Content',
    subtitle: 'Footer brand copy & copyright text',
    Icon: FileText,
  },
];

function normalizeOptionalUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function AdminSettingsPage() {
  const { data: settings } = useStoreSettings();
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [activeSection, setActiveSection] = useState<SettingsSectionId | null>(null);
  const [draft, setDraft] = useState<StoreSettings | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone?: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (settings && !draft) {
      setDraft(settings);
    }
  }, [settings, draft]);

  async function openSection(id: SettingsSectionId) {
    const base = settings ?? (await services.settings.getSettings());
    setDraft({
      ...base,
      socialLinks: {
        instagram: base.socialLinks?.instagram ?? '',
        facebook: base.socialLinks?.facebook ?? '',
        whatsapp: base.socialLinks?.whatsapp ?? '',
        youtube: base.socialLinks?.youtube ?? '',
      },
      seo: {
        title: base.seo?.title ?? '',
        description: base.seo?.description ?? '',
      },
      policies: {
        privacyPolicy: base.policies?.privacyPolicy ?? '',
        termsAndConditions: base.policies?.termsAndConditions ?? '',
        refundPolicy: base.policies?.refundPolicy ?? '',
      },
      footerContent: {
        description: base.footerContent?.description ?? '',
        copyrightText: base.footerContent?.copyrightText ?? '',
      },
    });
    setActiveSection(id);
  }

  function showNotice(message: string, tone: 'success' | 'error' = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3500);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !draft) return;
    setUploadingLogo(true);
    try {
      const dataUrl = await readImageFileAsDataUrl(file, 420, true);
      setDraft({ ...draft, logoUrl: dataUrl });
      showNotice('Logo ready! Tap "Save Changes" below.');
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Unable to upload logo.',
        'error'
      );
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    try {
      const sanitized: StoreSettings = {
        ...draft,
        storeName: draft.storeName.trim() || 'GiftKart',
        socialLinks: draft.socialLinks
          ? {
              instagram: normalizeOptionalUrl(draft.socialLinks.instagram),
              facebook: normalizeOptionalUrl(draft.socialLinks.facebook),
              whatsapp: normalizeOptionalUrl(draft.socialLinks.whatsapp),
              youtube: normalizeOptionalUrl(draft.socialLinks.youtube),
            }
          : draft.socialLinks,
      };
      await services.settings.updateSettings(sanitized);
      const sectionTitle =
        SETTINGS_GROUPS.find((g) => g.id === activeSection)?.title ||
        'Website Settings';
      await services.adminAuth.logActivity(`Updated ${sectionTitle}`, 'Website Settings');
      showNotice(`${sectionTitle} saved to live storefront!`);
      setActiveSection(null);
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : 'Could not save settings.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  if (activeSection && draft) {
    const sectionMeta = SETTINGS_GROUPS.find((g) => g.id === activeSection);
    return (
      <div className="space-y-3">
        <AdminToast
          message={toast?.message ?? null}
          tone={toast?.tone}
          onClose={() => setToast(null)}
        />

        <button
          type="button"
          onClick={() => setActiveSection(null)}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-extrabold text-[#6A11CB]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Website Settings</span>
        </button>

        <form
          onSubmit={handleSave}
          noValidate
          className="space-y-3 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-[0_8px_20px_-14px_rgba(106,17,203,0.18)]"
        >
          <div className="border-b border-[#F2E9FF] pb-2.5">
            <h2 className="text-[15.5px] font-extrabold text-[#1E1035]">
              {sectionMeta?.title}
            </h2>
            <p className="text-[11.5px] text-[#75648E]">
              {sectionMeta?.subtitle}
            </p>
          </div>

          {activeSection === 'general' && (
            <>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Website Name
                </label>
                <input
                  type="text"
                  value={draft.storeName}
                  onChange={(e) =>
                    setDraft({ ...draft, storeName: e.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-[13px] text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Tagline
                </label>
                <input
                  type="text"
                  value={draft.tagline}
                  onChange={(e) =>
                    setDraft({ ...draft, tagline: e.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-[13px] text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Website Logo
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-[#6A11CB]/30 bg-[#F5ECFF] px-3 text-xs font-bold text-[#6A11CB]"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                  </button>
                  {draft.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, logoUrl: '' })}
                      className="h-9 cursor-pointer rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-600"
                    >
                      Use Default
                    </button>
                  )}
                </div>
                {draft.logoUrl && (
                  <img
                    src={draft.logoUrl}
                    alt="Custom logo preview"
                    className="mt-2 h-11 w-auto rounded-lg border border-[#EFE3FF] bg-[#FAF6FF] p-1 object-contain"
                  />
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#EFE3FF] bg-[#FAF6FF] p-3">
                <div>
                  <p className="text-xs font-extrabold text-[#1E1035]">
                    Maintenance Mode
                  </p>
                  <p className="text-[11px] text-[#75648E]">
                    Temporarily pause public storefront while keeping Admin accessible
                  </p>
                </div>
                <AdminToggleSwitch
                  checked={Boolean(draft.maintenanceMode)}
                  onChange={(next) =>
                    setDraft({ ...draft, maintenanceMode: next })
                  }
                  label="Toggle maintenance mode"
                />
              </div>
            </>
          )}

          {activeSection === 'contact' && (
            <>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={draft.supportEmail}
                  onChange={(e) =>
                    setDraft({ ...draft, supportEmail: e.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-[13px] text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={draft.supportPhone}
                  onChange={(e) =>
                    setDraft({ ...draft, supportPhone: e.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-[13px] text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Service Area Summary
                </label>
                <input
                  type="text"
                  value={draft.serviceCitiesSummary}
                  onChange={(e) =>
                    setDraft({ ...draft, serviceCitiesSummary: e.target.value })
                  }
                  className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-[13px] text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>
            </>
          )}

          {activeSection === 'social' && (
            <>
              {(
                [
                  { key: 'instagram', label: 'Instagram Link', placeholder: 'instagram.com/yourpage' },
                  { key: 'facebook', label: 'Facebook Link', placeholder: 'facebook.com/yourpage' },
                  { key: 'whatsapp', label: 'WhatsApp Link', placeholder: 'wa.me/919382040746' },
                  { key: 'youtube', label: 'YouTube Link', placeholder: 'youtube.com/@yourchannel' },
                ] as const
              ).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={draft.socialLinks?.[key] ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        socialLinks: {
                          instagram: draft.socialLinks?.instagram ?? '',
                          facebook: draft.socialLinks?.facebook ?? '',
                          whatsapp: draft.socialLinks?.whatsapp ?? '',
                          youtube: draft.socialLinks?.youtube ?? '',
                          [key]: e.target.value,
                        },
                      })
                    }
                    placeholder={placeholder}
                    className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                  />
                </div>
              ))}
            </>
          )}

          {activeSection === 'seo' && (
            <>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={draft.seo?.title ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      seo: {
                        title: e.target.value,
                        description: draft.seo?.description ?? '',
                      },
                    })
                  }
                  className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  SEO Meta Description
                </label>
                <textarea
                  rows={4}
                  value={draft.seo?.description ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      seo: {
                        title: draft.seo?.title ?? '',
                        description: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] p-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>
            </>
          )}

          {activeSection === 'about' && (
            <>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  About Headline
                </label>
                <input
                  type="text"
                  value={draft.pageContent.aboutHeadline}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      pageContent: {
                        ...draft.pageContent,
                        aboutHeadline: e.target.value,
                      },
                    })
                  }
                  className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  About Page Content
                </label>
                <textarea
                  rows={5}
                  value={draft.pageContent.aboutStory}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      pageContent: {
                        ...draft.pageContent,
                        aboutStory: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] p-3 text-xs leading-relaxed text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>
            </>
          )}

          {activeSection === 'policies' && (
            <>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Privacy Policy Statement
                </label>
                <textarea
                  rows={3}
                  value={draft.policies?.privacyPolicy ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      policies: {
                        privacyPolicy: e.target.value,
                        termsAndConditions: draft.policies?.termsAndConditions ?? '',
                        refundPolicy: draft.policies?.refundPolicy ?? '',
                      },
                    })
                  }
                  className="w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] p-3 text-xs leading-relaxed text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Terms &amp; Conditions Statement
                </label>
                <textarea
                  rows={3}
                  value={draft.policies?.termsAndConditions ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      policies: {
                        privacyPolicy: draft.policies?.privacyPolicy ?? '',
                        termsAndConditions: e.target.value,
                        refundPolicy: draft.policies?.refundPolicy ?? '',
                      },
                    })
                  }
                  className="w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] p-3 text-xs leading-relaxed text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Return &amp; Refund Policy Statement
                </label>
                <textarea
                  rows={3}
                  value={draft.policies?.refundPolicy ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      policies: {
                        privacyPolicy: draft.policies?.privacyPolicy ?? '',
                        termsAndConditions: draft.policies?.termsAndConditions ?? '',
                        refundPolicy: e.target.value,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] p-3 text-xs leading-relaxed text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>
            </>
          )}

          {activeSection === 'footer' && (
            <>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Footer Brand Description
                </label>
                <textarea
                  rows={3}
                  value={draft.footerContent?.description ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      footerContent: {
                        description: e.target.value,
                        copyrightText: draft.footerContent?.copyrightText ?? '',
                      },
                    })
                  }
                  className="w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] p-3 text-xs leading-relaxed text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-bold text-[#4A3860]">
                  Copyright Text
                </label>
                <input
                  type="text"
                  value={draft.footerContent?.copyrightText ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      footerContent: {
                        description: draft.footerContent?.description ?? '',
                        copyrightText: e.target.value,
                      },
                    })
                  }
                  className="h-10 w-full rounded-xl border border-[#DFCEF7] bg-[#FAF8FF] px-3 text-xs text-[#1E1035] focus:border-[#6A11CB] focus:bg-white focus:outline-none"
                />
              </div>
            </>
          )}

          <div className="sticky bottom-0 -mx-4 border-t border-[#EFE3FF] bg-white px-4 pt-3 pb-1">
            <button
              type="submit"
              disabled={saving || uploadingLogo}
              className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6A11CB] to-[#9B23EA] text-xs font-extrabold text-white shadow-sm disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <AdminToast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />

      {SETTINGS_GROUPS.map(({ id, title, subtitle, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => void openSection(id)}
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#EBD8FF]/90 bg-white px-3.5 py-3.5 text-left shadow-[0_6px_16px_-12px_rgba(106,17,203,0.18)] transition-all active:scale-[0.99] hover:border-[#6A11CB]/40"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4EAFF] text-[#6A11CB]">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-extrabold text-[#1E1035]">
                {title}
              </p>
              <p className="truncate text-[11.5px] font-medium text-[#75648E]">
                {subtitle}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4.5 w-4.5 shrink-0 text-[#8B7AA0]" />
        </button>
      ))}
    </div>
  );
}
