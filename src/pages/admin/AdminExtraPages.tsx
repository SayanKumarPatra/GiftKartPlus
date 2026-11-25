import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  PencilLine,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  useNewsletterSubscribers,
  useOrders,
  useProductReviews,
  useProducts,
  useStoreSettings,
} from '../../hooks/useStoreData';
import { services } from '../../services/registry';
import { ASSET_MANIFEST } from '../../config/assetManifest';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/format';
import type { ProductReview } from '../../types';
import { Button } from '../../components/ui/Button';

/* ============================================================================
 * #7 ADMIN CUSTOMIZATION REQUESTS (/admin/customization-requests)
 * ========================================================================== */
export function AdminCustomizationRequestsPage() {
  const { data: orders } = useOrders();

  const requests = useMemo(() => {
    const list: {
      id: string;
      orderId: string;
      orderNumber: string;
      customerName: string;
      zone: string;
      status: string;
      productName: string;
      sku: string;
      quantity: number;
      personalizationDetails: string;
      customPhotoFileName?: string;
      createdAt: string;
    }[] = [];

    orders.forEach((order) => {
      order.items.forEach((item, idx) => {
        if (item.personalizationDetails?.trim() || item.customPhotoFileName) {
          list.push({
            id: `${order.id}-${idx}`,
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customer.fullName,
            zone: order.customer.deliveryZoneNameSnapshot,
            status: order.fulfillmentStatus,
            productName: item.productNameSnapshot,
            sku: item.productSkuSnapshot,
            quantity: item.quantity,
            personalizationDetails: item.personalizationDetails,
            customPhotoFileName: item.customPhotoFileName,
            createdAt: order.createdAt,
          });
        }
      });
    });

    return list;
  }, [orders]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#2A0E4D] sm:text-2xl">
            Custom Queue ({requests.length})
          </h1>
          <p className="text-[11px] text-[#5F4B78] sm:text-xs">
            Custom names, messages &amp; uploaded photos from placed orders
          </p>
        </div>
        <Link to="/admin/orders">
          <Button variant="glass" size="sm">
            <span>Orders</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-8 text-center text-xs text-[#5F4B78]">
          No customization requests recorded yet.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {requests.map((req) => (
            <div
              key={req.id}
              className="space-y-3 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2 border-b border-[#F0E4FF] pb-2.5">
                <div className="min-w-0">
                  <span className="font-mono text-sm font-bold text-[#6A11CB]">
                    {req.orderNumber}
                  </span>
                  <p className="truncate text-xs font-semibold text-[#2A0E4D]">
                    {req.customerName} · {req.zone}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-bold text-[#FF4D8D]">
                  {req.status}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-bold text-[#2A0E4D]">
                  {req.productName}{' '}
                  <span className="font-mono font-normal text-[#7B6496]">
                    ({req.sku} × {req.quantity})
                  </span>
                </p>

                {req.personalizationDetails && (
                  <div className="flex items-start gap-2 rounded-xl bg-[#FAF6FF] p-3 text-[#2A0E4D]">
                    <PencilLine className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6A11CB]" />
                    <p className="font-medium">{req.personalizationDetails}</p>
                  </div>
                )}

                {req.customPhotoFileName && (
                  <div className="flex items-center gap-2 rounded-xl bg-[#FFF0F6] px-3 py-2 font-semibold text-[#FF4D8D]">
                    <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{req.customPhotoFileName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#7B6496]">
                    {formatDateTime(req.createdAt)}
                  </span>
                  <Link
                    to={`/admin/orders?order=${encodeURIComponent(req.orderId)}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#6A11CB]"
                  >
                    <span>Open Order</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * #11 ADMIN REVIEWS MODERATION (/admin/reviews)
 * ========================================================================== */
export function AdminReviewsPage() {
  const { data: reviews } = useProductReviews();
  const { data: products } = useProducts({ includeInactive: true });
  const { pushToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id ?? 'prod-magic-mug-01');
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) return;
    const prod = products.find((p) => p.id === productId);
    const review: ProductReview = {
      id: `rev-${Date.now()}`,
      productId: prod?.id ?? productId,
      productName: prod?.name ?? 'GiftKart Product',
      authorName: authorName.trim(),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      comment: comment.trim(),
      isSampleData: true,
      isApproved: true,
      createdAt: new Date().toISOString(),
    };
    await services.community.upsertReview(review);
    setAuthorName('');
    setComment('');
    setShowForm(false);
    pushToast({ title: 'Review entry saved', variant: 'success' });
  }

  async function toggleApproved(review: ProductReview) {
    await services.community.upsertReview({ ...review, isApproved: !review.isApproved });
  }

  async function removeReview(reviewId: string) {
    await services.community.deleteReview(reviewId);
    pushToast({ title: 'Review removed', variant: 'info' });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-[#2A0E4D] sm:text-2xl">
            Reviews ({reviews.length})
          </h1>
          <p className="text-[11px] text-[#5F4B78] sm:text-xs">
            Approve, hide, or add sample preview reviews
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={() => setShowForm((p) => !p)}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showForm ? 'Close' : 'Add'}</span>
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => void handleAddReview(e)}
          className="space-y-3 rounded-2xl border border-[#6A11CB]/25 bg-white p-4 shadow-md sm:p-5"
        >
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-[#2A0E4D]">
            <MessageSquare className="h-4 w-4 text-[#FF4D8D]" />
            <span>Add Preview Review</span>
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="h-11 rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs focus:border-[#6A11CB] focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder="Reviewer Name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="h-11 rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="h-11 rounded-xl border border-[#EBD8FF] bg-white px-3 text-xs focus:border-[#6A11CB] focus:outline-none"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} Stars
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            required
            placeholder="Review text..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
          />
          <Button type="submit" size="sm" variant="primary" fullWidth>
            <Plus className="h-4 w-4" />
            <span>Save Review</span>
          </Button>
        </form>
      )}

      <div className="space-y-3">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="space-y-2.5 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#2A0E4D]">{rev.productName}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#FF4D8D]">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{rev.rating}.0</span>
                  <span className="text-[#7B6496]">· {rev.authorName}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void toggleApproved(rev)}
                  className={`min-h-[34px] rounded-lg px-2.5 text-xs font-bold ${
                    rev.isApproved ? 'bg-[#F4EBFF] text-[#6A11CB]' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {rev.isApproved ? 'Visible' : 'Hidden'}
                </button>
                <button
                  type="button"
                  onClick={() => void removeReview(rev.id)}
                  aria-label="Delete review"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EBD8FF] text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[#5F4B78]">{rev.comment}</p>
            <p className="text-[11px] text-[#8C75A8]">{formatDateTime(rev.createdAt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================================
 * #13 ADMIN WEBSITE PAGES CMS & ASSET MANIFEST (/admin/pages)
 * ========================================================================== */
export function AdminWebsitePagesPage() {
  const { data: settings } = useStoreSettings();
  const { data: subscribers } = useNewsletterSubscribers();
  const { pushToast } = useToast();

  const [desktopAnn, setDesktopAnn] = useState<string | null>(null);
  const [mobileAnn, setMobileAnn] = useState<string | null>(null);
  const [annEnabled, setAnnEnabled] = useState<boolean | null>(null);
  const [newsHeading, setNewsHeading] = useState<string | null>(null);
  const [newsDesc, setNewsDesc] = useState<string | null>(null);
  const [aboutHeadline, setAboutHeadline] = useState<string | null>(null);
  const [aboutStory, setAboutStory] = useState<string | null>(null);
  const [custHeadline, setCustHeadline] = useState<string | null>(null);
  const [custNote, setCustNote] = useState<string | null>(null);

  if (!settings) {
    return <p className="text-sm text-[#5F4B78]">Loading Website Pages CMS...</p>;
  }

  async function handleSaveCms(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    await services.settings.updateSettings({
      ...settings,
      announcement: {
        ...settings.announcement,
        enabled: annEnabled ?? settings.announcement.enabled,
        desktopText: desktopAnn ?? settings.announcement.desktopText,
        mobileText: mobileAnn ?? settings.announcement.mobileText,
      },
      newsletter: {
        ...settings.newsletter,
        heading: newsHeading ?? settings.newsletter.heading,
        description: newsDesc ?? settings.newsletter.description,
      },
      pageContent: {
        aboutHeadline: aboutHeadline ?? settings.pageContent.aboutHeadline,
        aboutStory: aboutStory ?? settings.pageContent.aboutStory,
        customizationHeadline: custHeadline ?? settings.pageContent.customizationHeadline,
        customizationNote: custNote ?? settings.pageContent.customizationNote,
      },
    });
    pushToast({
      title: 'Website copy saved',
      description: 'Storefront texts updated live.',
      variant: 'success',
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-[#2A0E4D] sm:text-2xl">
          Website Pages &amp; Copy
        </h1>
        <p className="text-[11px] text-[#5F4B78] sm:text-xs">
          Edit announcement strips, newsletter copy, About &amp; Guide content
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSaveCms(e)}
        className="space-y-4 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0E4FF] pb-3">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-[#2A0E4D]">
            <FileText className="h-4 w-4 text-[#6A11CB]" />
            <span>Storefront Copy</span>
          </h2>
          <label className="inline-flex min-h-[36px] cursor-pointer items-center gap-2 text-xs font-bold text-[#6A11CB]">
            <input
              type="checkbox"
              checked={annEnabled ?? settings.announcement.enabled}
              onChange={(e) => setAnnEnabled(e.target.checked)}
              className="h-4 w-4 accent-[#6A11CB]"
            />
            <span>Announcement Active</span>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#4A3862]">
              Desktop Announcement Strip
            </label>
            <input
              type="text"
              value={desktopAnn ?? settings.announcement.desktopText}
              onChange={(e) => setDesktopAnn(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4A3862]">
              Mobile Compact Strip
            </label>
            <input
              type="text"
              value={mobileAnn ?? settings.announcement.mobileText}
              onChange={(e) => setMobileAnn(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4A3862]">
              Newsletter Heading
            </label>
            <input
              type="text"
              value={newsHeading ?? settings.newsletter.heading}
              onChange={(e) => setNewsHeading(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4A3862]">
              Newsletter Description
            </label>
            <input
              type="text"
              value={newsDesc ?? settings.newsletter.description}
              onChange={(e) => setNewsDesc(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4A3862]">About Us Headline</label>
            <input
              type="text"
              value={aboutHeadline ?? settings.pageContent.aboutHeadline}
              onChange={(e) => setAboutHeadline(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4A3862]">
              Customization Guide Headline
            </label>
            <input
              type="text"
              value={custHeadline ?? settings.pageContent.customizationHeadline}
              onChange={(e) => setCustHeadline(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#EBD8FF] px-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#4A3862]">
              About Us Story Copy
            </label>
            <textarea
              rows={2}
              value={aboutStory ?? settings.pageContent.aboutStory}
              onChange={(e) => setAboutStory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] p-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#4A3862]">
              Customization Guide Intro
            </label>
            <textarea
              rows={2}
              value={custNote ?? settings.pageContent.customizationNote}
              onChange={(e) => setCustNote(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] p-3 text-sm focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
        </div>

        <Button type="submit" size="sm" variant="primary" fullWidth>
          <CheckCircle2 className="h-4 w-4" />
          <span>Save Website Copy</span>
        </Button>
      </form>

      {/* Newsletter Subscribers */}
      <div className="space-y-3 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs sm:p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-[#2A0E4D]">
          <Mail className="h-4 w-4 text-[#FF4D8D]" />
          <span>Newsletter Subscribers ({subscribers.length})</span>
        </h2>
        {subscribers.length === 0 ? (
          <p className="text-xs text-[#5F4B78]">No newsletter subscriptions yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subscribers.map((sub) => (
              <span
                key={sub.id}
                className="rounded-lg border border-[#EBD8FF] bg-[#FAF6FF] px-2.5 py-1 text-xs font-medium text-[#2A0E4D]"
              >
                {sub.email}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Asset Manifest (Mobile Cards + Desktop Table) */}
      <div className="space-y-3 rounded-2xl border border-[#EBD8FF] bg-white p-4 shadow-xs sm:p-5">
        <h2 className="font-display text-base font-bold text-[#2A0E4D]">
          Verified Asset Manifest ({ASSET_MANIFEST.length} Assets)
        </h2>

        <div className="space-y-2 md:hidden">
          {ASSET_MANIFEST.map((asset) => (
            <div
              key={asset.filename}
              className="rounded-xl border border-[#F0E4FF] bg-[#FDFBFF] p-3 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#6A11CB]">{asset.category}</span>
                <span className="text-[10.5px] font-bold text-emerald-700">{asset.status}</span>
              </div>
              <p className="mt-0.5 truncate font-mono text-[11px] text-[#2A0E4D]">
                {asset.filename}
              </p>
              <p className="mt-0.5 text-[11px] text-[#5F4B78]">{asset.purpose}</p>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#F0E4FF] text-[#7B6496]">
                <th className="pb-2 font-semibold">Category</th>
                <th className="pb-2 font-semibold">Filename</th>
                <th className="pb-2 font-semibold">Purpose &amp; Component</th>
                <th className="pb-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5ECFF]">
              {ASSET_MANIFEST.map((asset) => (
                <tr key={asset.filename} className="hover:bg-[#FAF6FF]">
                  <td className="py-2 font-semibold text-[#6A11CB]">{asset.category}</td>
                  <td className="py-2 font-mono text-[11px] text-[#2A0E4D]">{asset.filename}</td>
                  <td className="py-2 text-[#5F4B78]">
                    <p>{asset.purpose}</p>
                    <p className="text-[10px] text-[#8C75A8]">{asset.usedIn}</p>
                  </td>
                  <td className="py-2 text-right font-bold text-[#6A11CB]">{asset.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
