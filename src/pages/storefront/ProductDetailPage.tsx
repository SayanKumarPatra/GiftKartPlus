import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  Gift,
  Heart,
  ImagePlus,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import {
  useCategories,
  useGiftWrapConfig,
  useProducts,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { ProductImage } from '../../components/ui/ProductImage';
import { ProductCard } from '../../components/storefront/ProductCard';
import { MobileProductDetailPage } from '../../components/storefront/MobileProductDetailPage';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { formatInr } from '../../utils/format';
import {
  buildWhatsAppPersonalizationUrl,
  getVisibleVariantGroups,
  isProductPersonalized,
} from '../../utils/storefrontHelpers';

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { customerAccount } = useAuth();
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const { data: giftWrapConfig } = useGiftWrapConfig();
  const { data: settings } = useStoreSettings();
  const {
    items,
    addToCart,
    toggleWishlist,
    isWishlisted,
    giftWrap,
    setGiftWrapEnabled,
  } = useCart();
  const { pushToast } = useToast();
  const { t, translateCategory, localizeEntity } = useLanguage();

  const product = products.find((p) => p.slug === slug);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [personalizationText, setPersonalizationText] = useState('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | undefined>(undefined);
  const [photoFileName, setPhotoFileName] = useState<string | undefined>(undefined);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setActiveImageIdx(0);
    setPersonalizationText('');
    setPhotoPreviewUrl(undefined);
    setPhotoFileName(undefined);
    setPhotoError(null);
    setQuantity(1);
    if (product) {
      const defaults: Record<string, string> = {};
      getVisibleVariantGroups(product).forEach((v) => {
        if (v.options.length > 0) {
          defaults[v.name] = v.options[0];
        }
      });
      setSelectedVariants(defaults);
    }
  }, [product?.id]);

  if (isLoading) {
    return (
      <div className="h-96 animate-pulse rounded-3xl border border-[#EBD8FF] bg-[#F8F2FF]" />
    );
  }

  if (!product) {
    return (
      <EmptyState
        title={t('productNotFound')}
        description={t('productNotFoundDesc')}
        action={
          <Link to="/shop">
            <Button size="sm">{t('allGifts')}</Button>
          </Link>
        }
      />
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const displayProductName = localizeEntity(product.name, 'name', product.translations);
  const displayProductDesc = localizeEntity(
    product.description,
    'description',
    product.translations
  );
  const displayCategoryName = category
    ? translateCategory(category.name, category.translations)
    : undefined;
  const visibleVariantGroups = getVisibleVariantGroups(product);
  const personalized = isProductPersonalized(product);
  const saved = isWishlisted(product.id);
  const isInCart = items.some(
    (item) =>
      item.productId === product.id &&
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
  );
  const activeStyles = giftWrapConfig?.styles.filter((s) => s.isActive) ?? [];
  const activeZones = settings?.deliveryZones.filter((z) => z.isActive) ?? [];

  const discountPct =
    product.compareAtPriceInr && product.compareAtPriceInr > product.priceInr
      ? Math.round(
          ((product.compareAtPriceInr - product.priceInr) / product.compareAtPriceInr) * 100
        )
      : 0;

  const whatsappUrl = buildWhatsAppPersonalizationUrl(
    settings?.supportPhone,
    product.name,
    product.sku,
    selectedVariants
  );

  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.isActive && !p.isArchived && p.stockCount > 0)
    .sort(
      (a, b) =>
        Number(b.categoryId === product.categoryId) -
        Number(a.categoryId === product.categoryId)
    )
    .slice(0, 4);

  function handlePhotoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose a JPG, PNG, or WebP image file.');
      return;
    }
    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreviewUrl(reader.result);
        setPhotoFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleAddToCart() {
    if (!product) return;
    if (isInCart) {
      navigate('/cart');
      return;
    }
    addToCart(product, {
      quantity,
      selectedVariants,
      personalizationDetails: personalizationText,
      customPhotoFileName: photoFileName,
      customPhotoPreviewUrl: photoPreviewUrl,
    });
    pushToast({
      title: t('addedToCart'),
      variant: 'success',
      compact: true,
    });
  }

  function handleBuyNow() {
    if (!product || product.stockCount <= 0) return;
    if (!isInCart) {
      addToCart(product, {
        quantity,
        selectedVariants,
        personalizationDetails: personalizationText,
        customPhotoFileName: photoFileName,
        customPhotoPreviewUrl: photoPreviewUrl,
      });
    }
    navigate('/checkout');
  }

  const galleryImages = product.images.length > 0 ? product.images : [''];

  return (
    <>
      {/* Normal Mobile (< 900px): Universal Premium Mobile Product Details Redesign */}
      <div className="-mx-3.5 -my-4 sm:-mx-6 sm:-my-5 lg:hidden">
        <MobileProductDetailPage
          product={product}
          category={category}
          categories={categories}
          products={products}
          supportPhone={settings?.supportPhone}
        />
      </div>

      {/* Desktop & Laptop (>= 900px): Full Feature Parity with Mobile PDP */}
      <div className="hidden space-y-10 lg:block">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#6E5B85]"
        >
          <Link to="/" className="hover:text-[#6A11CB]">
            {t('home')}
          </Link>
          <span>/</span>
          <Link to="/categories" className="hover:text-[#6A11CB]">
            {t('categories')}
          </Link>
          {category && displayCategoryName && (
            <>
              <span>/</span>
              <Link to={`/category/${category.slug}`} className="hover:text-[#6A11CB]">
                {displayCategoryName}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="truncate font-semibold text-[#2B0B4E]">{displayProductName}</span>
        </nav>

        {/* Main Split Module */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left: Product Gallery + Thumbnails */}
          <div className="space-y-3 lg:col-span-6 lg:sticky lg:top-28">
            <div className="overflow-hidden rounded-2xl border border-[#EFE3FF] bg-white p-3 shadow-[0_8px_28px_-14px_rgba(106,17,203,0.16)]">
              <div className="relative overflow-hidden rounded-xl bg-[#FAF7FF]">
                <ProductImage
                  src={galleryImages[activeImageIdx]}
                  alt={product.name}
                  aspectClass="aspect-square"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!customerAccount) {
                      navigate('/account', {
                        state: {
                          from: `${location.pathname}${location.search}`,
                          reason: 'wishlist',
                        },
                      });
                      return;
                    }
                    toggleWishlist(product.id);
                  }}
                  aria-label="Toggle wishlist"
                  className={`absolute right-3.5 top-3.5 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-colors ${
                    saved
                      ? 'border-[#FF4D8D] bg-[#FFF0F6] text-[#FF4D8D]'
                      : 'border-[#EBD8FF] bg-white/95 text-[#6A11CB] hover:bg-[#F8F2FF]'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${saved ? 'fill-[#FF4D8D]' : ''}`} />
                </button>
              </div>
            </div>

            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 bg-white transition-all ${
                      idx === activeImageIdx
                        ? 'border-[#6A11CB] shadow-sm'
                        : 'border-[#EBD8FF] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <ProductImage
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      aspectClass="aspect-square"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Purchase & Personalization Column */}
          <div className="space-y-5 rounded-2xl border border-[#EFE3FF] bg-white p-6 shadow-[0_8px_28px_-14px_rgba(106,17,203,0.12)] lg:col-span-6">
            <div>
              <p className="font-mono text-xs font-semibold text-[#7A6894]">
                {displayCategoryName} · {t('sku')}: {product.sku}
              </p>
              <h1 className="mt-1.5 font-display text-2xl font-bold leading-snug text-[#1E1035] xl:text-[28px]">
                {displayProductName}
              </h1>

              {/* Pricing Row */}
              <div className="mt-3.5 flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-3xl font-extrabold tabular-nums text-[#6A11CB]">
                  {formatInr(product.priceInr)}
                </span>
                {product.compareAtPriceInr &&
                  product.compareAtPriceInr > product.priceInr && (
                    <span className="font-mono text-base tabular-nums text-[#8B7AA0] line-through">
                      {formatInr(product.compareAtPriceInr)}
                    </span>
                  )}
                {discountPct > 0 && (
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                    {discountPct}% {t('off')}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#6E5B85]">
                {t('inclusiveOfTaxes')} · {t('codLabel')}
              </p>

              <p className="mt-3.5 text-sm leading-relaxed text-[#4B3963]">
                {displayProductDesc}
              </p>
            </div>

            {/* Filtered Variants (Hides Capacity / Handle Style, matching Mobile) */}
            {visibleVariantGroups.length > 0 && (
              <div className="space-y-4 border-t border-[#EFE3FF] pt-4">
                {visibleVariantGroups.map((group) => (
                  <div key={group.name}>
                    <p className="text-xs font-bold text-[#2B0B4E]">
                      {group.name}:{' '}
                      <span className="text-[#6A11CB]">
                        {selectedVariants[group.name] ?? group.options[0]}
                      </span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.options.map((opt) => {
                        const active = selectedVariants[group.name] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setSelectedVariants((prev) => ({
                                ...prev,
                                [group.name]: opt,
                              }))
                            }
                            className={`min-h-[38px] cursor-pointer rounded-xl px-4 text-xs font-bold transition-all ${
                              active
                                ? 'bg-[#6A11CB] text-white shadow-sm'
                                : 'border border-[#EBD8FF] bg-[#FAF6FF] text-[#2B0B4E] hover:border-[#6A11CB]/50'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Personalization & WhatsApp Photo Sharing Card (Matches Mobile) */}
            {personalized && (
              <div className="space-y-4 rounded-2xl border border-[#EBD8FF] bg-[#FAF6FF] p-4">
                {product.supportsPersonalization && (
                  <div>
                    <label className="block text-xs font-bold text-[#2B0B4E]">
                      Personalization Note / Custom Name
                    </label>
                    <input
                      type="text"
                      value={personalizationText}
                      onChange={(e) => setPersonalizationText(e.target.value)}
                      maxLength={120}
                      placeholder={
                        product.personalizationPrompt ??
                        'Enter custom name, date, or short message'
                      }
                      className="mt-1.5 w-full rounded-xl border border-[#DFD2F2] bg-white px-3.5 py-2.5 text-sm text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                    />
                  </div>
                )}

                {product.supportsPhotoUpload && (
                  <div>
                    <label className="block text-xs font-bold text-[#2B0B4E]">
                      Attach Custom Photo (Optional)
                    </label>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <label className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#6A11CB]/50 bg-white px-4 text-xs font-bold text-[#6A11CB] hover:bg-[#FFF0F6]">
                        <ImagePlus className="h-4 w-4 text-[#FF4D8D]" />
                        <span>{photoFileName ? 'Change Photo' : 'Choose Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="sr-only"
                        />
                      </label>

                      {photoPreviewUrl && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-[#EBD8FF] bg-white p-1.5 pr-3">
                          <img
                            src={photoPreviewUrl}
                            alt="Uploaded custom preview"
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                          <span className="max-w-[160px] truncate text-xs font-semibold text-[#2B0B4E]">
                            {photoFileName}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoPreviewUrl(undefined);
                              setPhotoFileName(undefined);
                            }}
                            aria-label={t('removePhoto')}
                            className="cursor-pointer rounded-lg p-1 text-[#6E5B85] hover:bg-[#FFF0F6] hover:text-[#C81E68]"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {photoError && (
                      <p className="mt-1 text-xs font-semibold text-[#C81E68]">
                        {photoError}
                      </p>
                    )}
                  </div>
                )}

                {/* WhatsApp Direct Customization Share Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-emerald-900">
                      Share Photos or Custom Details on WhatsApp
                    </p>
                    <p className="mt-0.5 text-[11px] text-emerald-800/80">
                      Send high-resolution photos or special print instructions directly to our GiftKart studio team.
                    </p>
                  </div>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#16A34A] px-3.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#15803D]"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp Studio</span>
                  </a>
                </div>
              </div>
            )}

            {/* Boutique Gift Wrapping Toggle */}
            {giftWrapConfig?.globallyEnabled && activeStyles.length > 0 && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#EFE3FF] bg-[#FFF5FA]/80 p-3.5">
                <div className="flex items-start gap-2.5">
                  <Gift className="mt-0.5 h-5 w-5 shrink-0 text-[#FF4D8D]" />
                  <div>
                    <p className="text-xs font-bold text-[#2B0B4E]">
                      Add Boutique Gift Wrapping &amp; Message Card
                    </p>
                    <p className="text-[11px] text-[#594A6B]">
                      Starts from{' '}
                      {formatInr(Math.min(...activeStyles.map((s) => s.chargeInr)))} ·
                      Customize style &amp; note in Cart.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGiftWrapEnabled(!giftWrap.enabled, activeStyles[0])}
                  className={`inline-flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold whitespace-nowrap transition-colors ${
                    giftWrap.enabled
                      ? 'bg-[#6A11CB] text-white'
                      : 'border border-[#EBD8FF] bg-white text-[#6A11CB] hover:bg-[#FAF5FF]'
                  }`}
                >
                  {giftWrap.enabled && <Check className="h-3.5 w-3.5" />}
                  <span>{giftWrap.enabled ? 'Wrap Added' : 'Add Wrap'}</span>
                </button>
              </div>
            )}

            {/* Quantity + Add to Cart + Buy Now */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#2B0B4E]">{t('quantity')}</span>
                <div className="inline-flex h-10 items-center rounded-lg border border-[#DFD2F2] bg-[#FAF6FF] px-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[#2B0B4E] hover:bg-white"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[34px] text-center font-mono text-sm font-bold tabular-nums text-[#2B0B4E]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.min(product.stockCount || 10, q + 1))
                    }
                    aria-label="Increase quantity"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-[#2B0B4E] hover:bg-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-xs font-medium text-[#6E5B85]">
                  {product.stockCount > 0
                    ? `${product.stockCount} ${t('available')}`
                    : t('outOfStock')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!isInCart && product.stockCount <= 0}
                  className={`flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    isInCart
                      ? 'border-2 border-[#6A11CB] bg-[#F5ECFF] text-[#6A11CB] hover:bg-[#EDE0FF]'
                      : 'border-2 border-[#6A11CB] bg-white text-[#6A11CB] hover:bg-[#FAF5FF]'
                  }`}
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>
                    {isInCart
                      ? t('goToCart')
                      : product.stockCount > 0
                        ? t('addToCart')
                        : t('outOfStock')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={product.stockCount <= 0}
                  className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6A11CB] via-[#A21CAF] to-[#FF4D8D] px-5 text-sm font-bold text-white shadow-[0_10px_24px_-8px_rgba(106,17,203,0.45)] transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" />
                  <span>{t('buyNow')} · {formatInr(product.priceInr * quantity)}</span>
                </button>
              </div>
            </div>

            {/* Trust & Delivery Strip */}
            <div className="grid grid-cols-3 gap-3 border-t border-[#EFE3FF] pt-4 text-xs text-[#594A6B]">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#FF4D8D]" />
                <span>
                  {t('deliveryZone')}:{' '}
                  <strong className="text-[#2B0B4E]">
                    {activeZones.map((z) => z.name).join(' & ') || 'Jalchak'}
                  </strong>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#6A11CB]" />
                <span>{t('codLabel')}</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  {personalized
                    ? 'Customized items are non-returnable'
                    : '7-day return on unused items'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-[#EFE3FF] pt-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-[#1E1035]">
                {t('relatedGifts')}
              </h2>
              <Link
                to="/shop"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#6A11CB] hover:text-[#FF4D8D]"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{t('exploreAllGifts')}</span>
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {relatedProducts.map((rel) => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  categoryLabel={categories.find((c) => c.id === rel.categoryId)?.name}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
