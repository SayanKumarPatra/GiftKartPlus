import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  PencilLine,
  Plus,
  Star,
  Trash2,
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#2A0E4D]">
            Customization Requests ({requests.length})
          </h1>
          <p className="text-xs text-[#5F4B78]">
            Production queue of custom text engravings, name prints, and client-side photo preview filenames frozen inside Demo Orders.
          </p>
        </div>
        <Link to="/admin/orders">
          <Button variant="glass" size="sm">
            Go to Orders Queue →
          </Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-[#EBD8FF] bg-white p-8 text-center text-xs text-[#5F4B78]">
          No customization requests recorded yet. Place a personalized Demo Order on the storefront to inspect it here.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2 border-b border-[#F0E4FF] pb-3">
                <div>
                  <span className="font-mono text-sm font-bold text-[#6A11CB]">
                    {req.orderNumber}
                  </span>
                  <p className="text-xs font-semibold text-[#2A0E4D]">
                    {req.customerName} · {req.zone}
                  </p>
                </div>
                <span className="rounded-full bg-[#F4EBFF] px-2.5 py-0.5 text-[11px] font-bold text-[#6A11CB]">
                  {req.status}
                </span>
              </div>

              <div className="text-xs space-y-1.5">
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
                    <span className="truncate">
                      Photo File (Browser Preview): {req.customPhotoFileName}
                    </span>
                  </div>
                )}

                <p className="pt-1 text-[11px] text-[#7B6496]">
                  Submitted {formatDateTime(req.createdAt)}
                </p>
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
    pushToast({
      title: 'Sample review entry saved',
      description: 'Marked explicitly as sample data until live verified orders are connected.',
      variant: 'success',
    });
  }

  async function toggleApproved(review: ProductReview) {
    await services.community.upsertReview({ ...review, isApproved: !review.isApproved });
  }

  async function removeReview(reviewId: string) {
    await services.community.deleteReview(reviewId);
    pushToast({ title: 'Review entry removed', variant: 'info' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#2A0E4D]">
          Reviews Moderation (Sample / Demo)
        </h1>
        <p className="text-xs text-[#5F4B78]">
          All demo review entries are transparently flagged as Sample Data so no fabricated customer reviews are ever misrepresented as real buyers.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleAddReview(e)}
        className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-3"
      >
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-[#2A0E4D]">
          <MessageSquare className="h-4 w-4 text-[#FF4D8D]" />
          <span>Add Sample Preview Review</span>
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] bg-white px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
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
            placeholder="Reviewer Label (e.g. Sample Buyer — Jalchak)"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
          />
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="rounded-xl border border-[#EBD8FF] bg-white px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} Stars (Sample)
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            required
            placeholder="Review text..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex-1 rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
          />
          <Button type="submit" size="sm" variant="primary">
            <Plus className="h-3.5 w-3.5" />
            <span>Save Entry</span>
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs flex flex-wrap items-start justify-between gap-4"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-[#2A0E4D]">{rev.productName}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF0F6] px-2.5 py-0.5 text-[11px] font-bold text-[#FF4D8D]">
                  <Star className="h-3 w-3 fill-current" />
                  {rev.rating}.0
                </span>
                {rev.isSampleData && (
                  <span className="rounded-full bg-[#F4EBFF] px-2 py-0.5 text-[10px] font-bold text-[#6A11CB]">
                    Sample Preview Data
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5F4B78]">{rev.comment}</p>
              <p className="text-[11px] text-[#7B6496]">
                {rev.authorName} · {formatDateTime(rev.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void toggleApproved(rev)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  rev.isApproved ? 'bg-[#F4EBFF] text-[#6A11CB]' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {rev.isApproved ? 'Visible' : 'Hidden'}
              </button>
              <button
                type="button"
                onClick={() => void removeReview(rev.id)}
                aria-label="Delete review"
                className="rounded-lg border border-[#EBD8FF] p-1.5 text-[#7B6496] hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
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
        customizationHeadline:
          custHeadline ?? settings.pageContent.customizationHeadline,
        customizationNote: custNote ?? settings.pageContent.customizationNote,
      },
    });
    pushToast({
      title: 'Website page content updated',
      description: 'Announcement Bar, Newsletter, and Storefront page copy saved locally.',
      variant: 'success',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#2A0E4D]">
          Website Pages, Announcement Bar &amp; Assets
        </h1>
        <p className="text-xs text-[#5F4B78]">
          Edit live storefront announcement strips, newsletter copy, About &amp; Customization Guide headings, and inspect the verified Asset Manifest.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSaveCms(e)}
        className="rounded-2xl border border-[#EBD8FF] bg-white p-6 shadow-xs space-y-5"
      >
        <div className="flex items-center justify-between border-b border-[#F0E4FF] pb-3">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-[#2A0E4D]">
            <FileText className="h-4 w-4 text-[#6A11CB]" />
            <span>Editable Announcement Bar &amp; Page Copy</span>
          </h2>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-[#6A11CB]">
            <input
              type="checkbox"
              checked={annEnabled ?? settings.announcement.enabled}
              onChange={(e) => setAnnEnabled(e.target.checked)}
              className="h-4 w-4 accent-[#6A11CB]"
            />
            <span>Announcement Bar Active</span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#4A3862]">
              Desktop Announcement Strip
            </label>
            <input
              type="text"
              value={desktopAnn ?? settings.announcement.desktopText}
              onChange={(e) => setDesktopAnn(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
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
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
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
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
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
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4A3862]">
              About Us Headline
            </label>
            <input
              type="text"
              value={aboutHeadline ?? settings.pageContent.aboutHeadline}
              onChange={(e) => setAboutHeadline(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
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
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
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
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
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
              className="mt-1 w-full rounded-xl border border-[#EBD8FF] px-3 py-2 text-xs focus:border-[#6A11CB] focus:outline-none"
            />
          </div>
        </div>

        <Button type="submit" size="sm" variant="primary">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Save Website Copy</span>
        </Button>
      </form>

      {/* Demo Newsletter Subscribers */}
      <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-3">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-[#2A0E4D]">
          <Mail className="h-4 w-4 text-[#FF4D8D]" />
          <span>Demo Newsletter Subscribers ({subscribers.length})</span>
        </h2>
        {subscribers.length === 0 ? (
          <p className="text-xs text-[#5F4B78]">
            No local newsletter subscriptions yet. Submit an email on the Homepage newsletter section to test.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subscribers.map((sub) => (
              <span
                key={sub.id}
                className="rounded-full border border-[#EBD8FF] bg-[#FAF6FF] px-3 py-1 text-xs font-medium text-[#2A0E4D]"
              >
                {sub.email}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Verified Asset Manifest Inventory */}
      <div className="rounded-2xl border border-[#EBD8FF] bg-white p-5 shadow-xs space-y-3">
        <h2 className="font-display text-base font-bold text-[#2A0E4D]">
          Verified Asset Manifest ({ASSET_MANIFEST.length} Active Local Assets)
        </h2>
        <div className="overflow-x-auto">
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
                  <td className="py-2 text-right">
                    <span className="rounded-full bg-[#F4EBFF] px-2 py-0.5 text-[10px] font-bold text-[#6A11CB]">
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
