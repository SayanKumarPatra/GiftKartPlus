import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Mail, Share2, X } from 'lucide-react';
import type { Product } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { formatInr } from '../../utils/format';
import { ProductImage } from '../ui/ProductImage';

const SHARE_EVENT_NAME = 'giftkart:open-product-share';

interface ShareEventDetail {
  product: Product;
}

export function openProductShare(product: Product) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<ShareEventDetail>(SHARE_EVENT_NAME, {
      detail: { product },
    })
  );
}

function WhatsAppSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.6 5.95L0 24l6.32-1.66a11.84 11.84 0 0 0 5.74 1.46h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.44-8.42ZM12.07 21.8h-.01a9.87 9.87 0 0 1-5.04-1.38l-.36-.21-3.75.98 1-3.65-.24-.37a9.84 9.84 0 0 1-1.52-5.27c0-5.45 4.44-9.89 9.91-9.89 2.64 0 5.13 1.03 7 2.9a9.82 9.82 0 0 1 2.9 7c0 5.46-4.44 9.89-9.89 9.89Zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.21 5.08 4.5.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

function FacebookSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M22.675 0h-21.35C.595 0 0 .593 0 1.326v21.348C0 23.406.595 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.594 1.323-1.326V1.326C24 .593 23.405 0 22.675 0Z" />
    </svg>
  );
}

function XTwitterSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

function TelegramSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0Zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z" />
    </svg>
  );
}

export function ProductShareHost() {
  const [product, setProduct] = useState<Product | null>(null);
  const [copied, setCopied] = useState(false);
  const { t, localizeEntity } = useLanguage();
  const { pushToast } = useToast();

  useEffect(() => {
    function handleOpen(event: Event) {
      const custom = event as CustomEvent<ShareEventDetail>;
      if (custom.detail?.product) {
        setProduct(custom.detail.product);
        setCopied(false);
      }
    }

    window.addEventListener(SHARE_EVENT_NAME, handleOpen);
    return () => window.removeEventListener(SHARE_EVENT_NAME, handleOpen);
  }, []);

  useEffect(() => {
    if (!product) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setProduct(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product]);

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const shareData = useMemo(() => {
    if (!product) return null;
    const displayName = localizeEntity(product.name, 'name', product.translations);
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : '';
    const url = `${origin}/product/${encodeURIComponent(product.slug)}`;
    const price = formatInr(product.priceInr);
    const text = `${displayName} — ${price} on GiftKart`;
    const fullTextWithUrl = `${text}\n${url}`;

    return {
      displayName,
      price,
      url,
      text,
      whatsappHref: `https://api.whatsapp.com/send?text=${encodeURIComponent(fullTextWithUrl)}`,
      facebookHref: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitterHref: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      telegramHref: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      emailHref: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(fullTextWithUrl)}`,
    };
  }, [product, localizeEntity]);

  if (!product || !shareData) return null;

  async function handleCopyLink() {
    if (!shareData) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareData.url);
      } else {
        const input = document.createElement('input');
        input.value = shareData.url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      pushToast({
        title: t('linkCopied'),
        variant: 'success',
        compact: true,
      });
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      pushToast({
        title: shareData.url,
        variant: 'info',
        compact: true,
      });
    }
  }

  async function handleNativeShare() {
    if (!shareData || !canNativeShare) return;
    try {
      await navigator.share({
        title: shareData.displayName,
        text: shareData.text,
        url: shareData.url,
      });
      setProduct(null);
    } catch {
      // User dismissed native share sheet — stay quietly in modal
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-share-title"
      className="fixed inset-0 z-[75] flex items-end justify-center bg-[#1A0833]/50 p-3 backdrop-blur-[2px] sm:items-center"
      onClick={() => setProduct(null)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] overflow-hidden rounded-[22px] border border-[#EBD8FF] bg-white shadow-[0_24px_60px_-16px_rgba(43,11,78,0.45)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F2E6FF] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5ECFF] text-[#6A11CB]">
              <Share2 className="h-3.5 w-3.5 stroke-[2.2]" />
            </span>
            <h2
              id="product-share-title"
              className="text-[14.5px] font-extrabold text-[#2B0B4E]"
            >
              {t('share')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setProduct(null)}
            aria-label="Close share modal"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#6E5B85] transition-colors hover:bg-[#F5ECFF] hover:text-[#2B0B4E]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Product Preview */}
        <div className="flex items-center gap-3 border-b border-[#F5EEFF] bg-[#FBF8FF] px-4 py-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#EBD8FF] bg-white">
            <ProductImage
              src={product.images[0]}
              alt={shareData.displayName}
              aspectClass="aspect-square"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-[#2B0B4E]">
              {shareData.displayName}
            </p>
            <p className="mt-0.5 text-[13px] font-extrabold tabular-nums text-[#FF4D8D]">
              {shareData.price}
            </p>
          </div>
        </div>

        {/* Social Media Grid */}
        <div className="px-4 py-4">
          <div className="grid grid-cols-5 gap-2 text-center">
            <a
              href={shareData.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setProduct(null)}
              className="group flex flex-col items-center gap-1.5 rounded-xl py-1.5 transition-colors hover:bg-[#F0FDF4]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xs transition-transform group-hover:scale-105">
                <WhatsAppSvg className="h-5 w-5" />
              </span>
              <span className="text-[10.5px] font-semibold text-[#3B2654]">WhatsApp</span>
            </a>

            <a
              href={shareData.facebookHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setProduct(null)}
              className="group flex flex-col items-center gap-1.5 rounded-xl py-1.5 transition-colors hover:bg-[#EFF6FF]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-xs transition-transform group-hover:scale-105">
                <FacebookSvg className="h-4 w-4" />
              </span>
              <span className="text-[10.5px] font-semibold text-[#3B2654]">Facebook</span>
            </a>

            <a
              href={shareData.telegramHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setProduct(null)}
              className="group flex flex-col items-center gap-1.5 rounded-xl py-1.5 transition-colors hover:bg-[#F0F9FF]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#229ED9] text-white shadow-xs transition-transform group-hover:scale-105">
                <TelegramSvg className="h-5 w-5" />
              </span>
              <span className="text-[10.5px] font-semibold text-[#3B2654]">Telegram</span>
            </a>

            <a
              href={shareData.twitterHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setProduct(null)}
              className="group flex flex-col items-center gap-1.5 rounded-xl py-1.5 transition-colors hover:bg-slate-100"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F172A] text-white shadow-xs transition-transform group-hover:scale-105">
                <XTwitterSvg className="h-4 w-4" />
              </span>
              <span className="text-[10.5px] font-semibold text-[#3B2654]">X</span>
            </a>

            <a
              href={shareData.emailHref}
              onClick={() => setProduct(null)}
              className="group flex flex-col items-center gap-1.5 rounded-xl py-1.5 transition-colors hover:bg-[#F5ECFF]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6A11CB] text-white shadow-xs transition-transform group-hover:scale-105">
                <Mail className="h-4 w-4" />
              </span>
              <span className="text-[10.5px] font-semibold text-[#3B2654]">Email</span>
            </a>
          </div>

          {/* Native Share Sheet (Mobile OS Apps: Instagram, Messenger, SMS, etc.) */}
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="mt-3 flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#6A11CB] to-[#FF4D8D] px-4 text-[12px] font-bold text-white shadow-xs transition-transform active:scale-[0.98]"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>More Apps (Instagram, SMS...)</span>
            </button>
          )}

          {/* Copy Link Row */}
          <div className="mt-3 flex items-center gap-2 rounded-full border border-[#EBD8FF] bg-[#FAF6FF] p-1 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#5B4875]">
              {shareData.url}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full px-3 text-[11.5px] font-bold whitespace-nowrap transition-colors ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#6A11CB] text-white hover:bg-[#550DA8]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
