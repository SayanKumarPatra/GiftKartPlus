import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Check,
  Gift,
  Heart,
  ImagePlus,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  X,
} from 'lucide-react';
import {
  useCategories,
  useGiftWrapConfig,
  useProducts,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { ProductImage } from '../../components/ui/ProductImage';
import { ProductCard } from '../../components/storefront/ProductCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { formatInr } from '../../utils/format';

export function ProductDetailPage() {
  const { slug } = useParams();
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const { data: giftWrapConfig } = useGiftWrapConfig();
  const { data: settings } = useStoreSettings();
  const {
    addToCart,
    toggleWishlist,
    isWishlisted,
    giftWrap,
    setGiftWrapEnabled,
    openCartDrawer,
  } = useCart();
  const { pushToast } = useToast();

  const product = products.find((p) => p.slug === slug);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [personalizationText, setPersonalizationText] = useState('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | undefined>(undefined);
  const [photoFileName, setPhotoFileName] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setActiveImageIdx(0);
    setPersonalizationText('');
    setPhotoPreviewUrl(undefined);
    setPhotoFileName(undefined);
    setQuantity(1);
    if (product) {
      const defaults: Record<string, string> = {};
      product.variants.forEach((v) => {
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
        title="Product not found"
        description="The personalized gift you requested is unavailable or has been moved."
        action={
          <Link to="/shop">
            <Button size="sm">Back to Shop</Button>
          </Link>
        }
      />
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const subcategory = category?.subcategories.find((s) => s.id === product.subcategoryId);
  const saved = isWishlisted(product.id);
  const activeStyles = giftWrapConfig?.styles.filter((s) => s.isActive) ?? [];
  const activeZones = settings?.deliveryZones.filter((z) => z.isActive) ?? [];

  const discountPct =
    product.compareAtPriceInr && product.compareAtPriceInr > product.priceInr
      ? Math.round(
          ((product.compareAtPriceInr - product.priceInr) / product.compareAtPriceInr) * 100
        )
      : 0;

  const relatedProducts = products
    .filter((p) => p.id !== product.id)
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
      pushToast({
        title: 'Invalid file format',
        description: 'Please choose a JPG, PNG, or WebP photo for preview.',
        variant: 'error',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreviewUrl(reader.result);
        setPhotoFileName(file.name);
        pushToast({
          title: 'Photo preview ready',
          description: `${file.name} attached locally for demo preview.`,
          variant: 'success',
        });
      }
    };
    reader.readAsDataURL(file);
  }

  function handleAddToCart() {
    if (!product) return;
    addToCart(product, {
      quantity,
      selectedVariants,
      personalizationDetails: personalizationText,
      customPhotoFileName: photoFileName,
      customPhotoPreviewUrl: photoPreviewUrl,
    });
    pushToast({
      title: 'Added to Gift Bag',
      description: `${product.name} × ${quantity}`,
      variant: 'success',
    });
    openCartDrawer();
  }

  const galleryImages = product.images.length > 0 ? product.images : [''];

  return (
    <div className="space-y-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#6E5B85]">
        <Link to="/" className="hover:text-[#6A11CB]">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-[#6A11CB]">Shop</Link>
        {category && (
          <>
            <span>/</span>
            <Link to={`/category/${category.slug}`} className="hover:text-[#6A11CB]">
              {category.name}
            </Link>
          </>
        )}
        {subcategory && (
          <>
            <span>/</span>
            <Link
              to={`/shop?category=${category?.slug}&subcategory=${subcategory.slug}`}
              className="text-[#FF4D8D] hover:underline"
            >
              {subcategory.name}
            </Link>
          </>
        )}
      </nav>

      {/* Main Split Module */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left: Large Image Gallery + Thumbnails */}
        <div className="space-y-3 lg:col-span-6 lg:sticky lg:top-24">
          <div className="gk-card overflow-hidden rounded-3xl p-3">
            <div className="overflow-hidden rounded-2xl">
              <ProductImage
                src={galleryImages[activeImageIdx]}
                alt={product.name}
                aspectClass="aspect-[4/3]"
              />
            </div>
          </div>

          {galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`h-20 w-24 shrink-0 overflow-hidden rounded-2xl border-2 transition-all ${
                    idx === activeImageIdx
                      ? 'border-[#6A11CB] shadow-md'
                      : 'border-[#EBD8FF] opacity-80 hover:opacity-100'
                  }`}
                >
                  <ProductImage src={img} alt={`${product.name} view ${idx + 1}`} aspectClass="aspect-[4/3]" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase & Personalization Module */}
        <div className="gk-card space-y-5 rounded-3xl p-6 sm:p-8 lg:col-span-6">
          <div>
            <p className="font-mono text-xs font-semibold text-[#6E5B85]">
              {category?.name}
              {subcategory ? ` · ${subcategory.name}` : ''} · SKU: {product.sku}
            </p>
            <h1 className="mt-1.5 text-2xl font-extrabold text-[#3B0764] sm:text-3xl">
              {product.name}
            </h1>

            {product.sampleRating !== undefined && (
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-mono font-bold tabular-nums text-[#2B0B4E]">
                  {product.sampleRating.toFixed(1)}
                </span>
                <span className="text-[#6E5B85]">
                  (Sample preview rating · {product.sampleReviewCount ?? 0} sample reviews)
                </span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="font-mono text-3xl font-extrabold tabular-nums text-[#6A11CB]">
                {formatInr(product.priceInr)}
              </span>
              {product.compareAtPriceInr && product.compareAtPriceInr > product.priceInr && (
                <span className="font-mono text-base tabular-nums text-[#8B7AA0] line-through">
                  {formatInr(product.compareAtPriceInr)}
                </span>
              )}
              {discountPct > 0 && (
                <span className="rounded-full bg-[#FF4D8D] px-2.5 py-1 font-mono text-xs font-bold tabular-nums text-white">
                  Save {discountPct}%
                </span>
              )}
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[#4B2C70]">
              {product.description}
            </p>
          </div>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="space-y-4 border-t border-[#EBD8FF] pt-4">
              {product.variants.map((group) => (
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
                            setSelectedVariants((prev) => ({ ...prev, [group.name]: opt }))
                          }
                          className={`min-h-[38px] rounded-xl px-4 text-xs font-bold transition-all ${
                            active
                              ? 'bg-[#6A11CB] text-white shadow-sm'
                              : 'border border-[#EBD8FF] bg-[#F8F2FF] text-[#2B0B4E] hover:border-[#6A11CB]/50'
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

          {/* Customization Fields + Photo Upload Preview */}
          {product.supportsPersonalization && (
            <div className="space-y-4 rounded-2xl border border-[#EBD8FF] bg-[#F8F2FF]/80 p-4">
              <div>
                <label className="block text-xs font-bold text-[#3B0764]">
                  Personalization Note / Name Print
                </label>
                <input
                  type="text"
                  value={personalizationText}
                  onChange={(e) => setPersonalizationText(e.target.value)}
                  maxLength={120}
                  placeholder={
                    product.personalizationPrompt ?? 'Enter custom name, date, or short quote'
                  }
                  className="mt-1.5 w-full rounded-xl border border-[#EBD8FF] bg-white px-3.5 py-2.5 text-sm text-[#2B0B4E] focus:border-[#6A11CB] focus:outline-none"
                />
              </div>

              {product.supportsPhotoUpload && (
                <div>
                  <label className="block text-xs font-bold text-[#3B0764]">
                    Custom Photo Preview (Optional · Local Preview)
                  </label>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#6A11CB]/50 bg-white px-4 text-xs font-bold text-[#6A11CB] hover:bg-[#FFF0F6]">
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
                        <span className="max-w-[140px] truncate text-xs font-semibold text-[#2B0B4E]">
                          {photoFileName}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreviewUrl(undefined);
                            setPhotoFileName(undefined);
                          }}
                          aria-label="Remove uploaded preview"
                          className="rounded-lg p-1 text-[#6E5B85] hover:bg-rose-50 hover:text-rose-700"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-[#6E5B85]">
                    Previewed locally in your browser; cloud upload activates once Supabase Storage is connected.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Gift Wrapping Option Quick Toggle */}
          {giftWrapConfig?.globallyEnabled && activeStyles.length > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#EBD8FF] bg-[#FFF0F6]/70 p-4">
              <div className="flex items-start gap-2.5">
                <Gift className="mt-0.5 h-5 w-5 shrink-0 text-[#FF4D8D]" />
                <div>
                  <p className="text-xs font-bold text-[#2B0B4E]">
                    Add Boutique Gift Wrapping &amp; Message Card
                  </p>
                  <p className="text-[11px] text-[#594A6B]">
                    Styles from {formatInr(Math.min(...activeStyles.map((s) => s.chargeInr)))} · Customize style &amp; recipient in Cart.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGiftWrapEnabled(!giftWrap.enabled, activeStyles[0])}
                className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 text-xs font-bold whitespace-nowrap ${
                  giftWrap.enabled
                    ? 'bg-[#6A11CB] text-white'
                    : 'border border-[#EBD8FF] bg-white text-[#6A11CB]'
                }`}
              >
                {giftWrap.enabled && <Check className="h-3.5 w-3.5" />}
                <span>{giftWrap.enabled ? 'Wrap Added' : 'Add Wrap'}</span>
              </button>
            </div>
          )}

          {/* Quantity + Add to Cart + Wishlist */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="inline-flex h-12 items-center rounded-full border border-[#EBD8FF] bg-[#F8F2FF] px-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#2B0B4E] hover:bg-white"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[36px] text-center font-mono text-sm font-bold tabular-nums text-[#2B0B4E]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stockCount || 10, q + 1))}
                aria-label="Increase quantity"
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#2B0B4E] hover:bg-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stockCount <= 0}
              className="gk-btn-purple flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition-all disabled:opacity-50"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>
                {product.stockCount > 0
                  ? `Add to Cart · ${formatInr(product.priceInr * quantity)}`
                  : 'Currently Out of Stock'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                const added = toggleWishlist(product.id);
                pushToast({
                  title: added ? 'Saved to Wishlist' : 'Removed from Wishlist',
                  description: product.name,
                  variant: 'info',
                });
              }}
              aria-label="Toggle wishlist"
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
                saved
                  ? 'border-[#FF4D8D] bg-[#FFF0F6] text-[#FF4D8D]'
                  : 'border-[#EBD8FF] bg-white text-[#6A11CB] hover:bg-[#F8F2FF]'
              }`}
            >
              <Heart className={`h-5 w-5 ${saved ? 'fill-[#FF4D8D]' : ''}`} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-[#EBD8FF] pt-4 text-xs text-[#594A6B]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#2B0B4E]">
              <MapPin className="h-4 w-4 text-[#FF4D8D]" />
              Delivers to: {activeZones.map((z) => z.name).join(' & ') || 'Jalchak'}
            </span>
            <span>In Stock ({product.stockCount} available)</span>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-extrabold text-[#3B0764]">
            You May Also Love
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
  );
}
