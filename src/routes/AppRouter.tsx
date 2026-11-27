import { Suspense, lazy, type ComponentType } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { StorefrontLayout } from '../layouts/StorefrontLayout';
import { AdminRouteGuard } from '../components/admin/AdminRouteGuard';
import { HomePage } from '../pages/storefront/HomePage';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../context/LanguageContext';

const CHUNK_RELOAD_KEY = 'giftkart:chunk-reload-at';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>
) {
  return lazy<T>(async () => {
    try {
      return await importer();
    } catch (firstError) {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      try {
        return await importer();
      } catch (secondError) {
        if (typeof window !== 'undefined') {
          const lastReload = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) || '0');
          if (Date.now() - lastReload > 10000) {
            window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
            window.location.reload();
          }
        }
        throw secondError ?? firstError;
      }
    }
  });
}

// Lazy-loaded secondary storefront modules (keeps initial mobile Home bundle lightweight)
const ShopPage = lazyWithRetry(() =>
  import('../pages/storefront/CatalogPages').then((m) => ({ default: m.ShopPage }))
);
const AllCategoriesPage = lazyWithRetry(() =>
  import('../pages/storefront/CatalogPages').then((m) => ({
    default: m.AllCategoriesPage,
  }))
);
const CategoryDetailPage = lazyWithRetry(() =>
  import('../pages/storefront/CatalogPages').then((m) => ({
    default: m.CategoryDetailPage,
  }))
);
const WishlistPage = lazyWithRetry(() =>
  import('../pages/storefront/CatalogPages').then((m) => ({ default: m.WishlistPage }))
);
const ProductDetailPage = lazyWithRetry(() =>
  import('../pages/storefront/ProductDetailPage').then((m) => ({
    default: m.ProductDetailPage,
  }))
);
const CartPage = lazyWithRetry(() =>
  import('../pages/storefront/CartAndCheckoutPages').then((m) => ({
    default: m.CartPage,
  }))
);
const CheckoutPage = lazyWithRetry(() =>
  import('../pages/storefront/CartAndCheckoutPages').then((m) => ({
    default: m.CheckoutPage,
  }))
);
const OrderConfirmationPage = lazyWithRetry(() =>
  import('../pages/storefront/CartAndCheckoutPages').then((m) => ({
    default: m.OrderConfirmationPage,
  }))
);
const CustomerAccountPage = lazyWithRetry(() =>
  import('../pages/storefront/AccountAndOrderPages').then((m) => ({
    default: m.CustomerAccountPage,
  }))
);
const MyOrdersPage = lazyWithRetry(() =>
  import('../pages/storefront/AccountAndOrderPages').then((m) => ({
    default: m.MyOrdersPage,
  }))
);
const CustomizationGuidePage = lazyWithRetry(() =>
  import('../pages/storefront/CustomerExtraPages').then((m) => ({
    default: m.CustomizationGuidePage,
  }))
);
const OrderDetailsPage = lazyWithRetry(() =>
  import('../pages/storefront/CustomerExtraPages').then((m) => ({
    default: m.OrderDetailsPage,
  }))
);
const SavedAddressesPage = lazyWithRetry(() =>
  import('../pages/storefront/CustomerExtraPages').then((m) => ({
    default: m.SavedAddressesPage,
  }))
);
const AboutUsPage = lazyWithRetry(() =>
  import('../pages/storefront/InfoAndPolicyPages').then((m) => ({
    default: m.AboutUsPage,
  }))
);
const ContactUsPage = lazyWithRetry(() =>
  import('../pages/storefront/InfoAndPolicyPages').then((m) => ({
    default: m.ContactUsPage,
  }))
);
const FaqPage = lazyWithRetry(() =>
  import('../pages/storefront/InfoAndPolicyPages').then((m) => ({
    default: m.FaqPage,
  }))
);
const PolicyPage = lazyWithRetry(() =>
  import('../pages/storefront/InfoAndPolicyPages').then((m) => ({
    default: m.PolicyPage,
  }))
);

// Lazy-loaded Admin Panel modules (excluded from initial customer storefront download)
const AdminLayout = lazyWithRetry(() =>
  import('../layouts/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AdminLoginPage = lazyWithRetry(() =>
  import('../pages/admin/AdminLoginPage').then((m) => ({
    default: m.AdminLoginPage,
  }))
);
const AdminDashboardPage = lazyWithRetry(() =>
  import('../pages/admin/AdminDashboardAndMorePages').then((m) => ({
    default: m.AdminDashboardPage,
  }))
);
const AdminMorePage = lazyWithRetry(() =>
  import('../pages/admin/AdminDashboardAndMorePages').then((m) => ({
    default: m.AdminMorePage,
  }))
);
const AdminBannerPage = lazyWithRetry(() =>
  import('../pages/admin/AdminBannerPage').then((m) => ({
    default: m.AdminBannerPage,
  }))
);
const AdminProductsPage = lazyWithRetry(() =>
  import('../pages/admin/AdminProductsPage').then((m) => ({
    default: m.AdminProductsPage,
  }))
);
const AdminCategoriesPage = lazyWithRetry(() =>
  import('../pages/admin/AdminCategoriesPage').then((m) => ({
    default: m.AdminCategoriesPage,
  }))
);
const AdminOrdersPage = lazyWithRetry(() =>
  import('../pages/admin/AdminOrdersPage').then((m) => ({
    default: m.AdminOrdersPage,
  }))
);
const AdminOffersPage = lazyWithRetry(() =>
  import('../pages/admin/AdminOffersPage').then((m) => ({
    default: m.AdminOffersPage,
  }))
);
const AdminCustomersPage = lazyWithRetry(() =>
  import('../pages/admin/AdminCustomersPage').then((m) => ({
    default: m.AdminCustomersPage,
  }))
);
const AdminNotificationsPage = lazyWithRetry(() =>
  import('../pages/admin/AdminNotificationsPage').then((m) => ({
    default: m.AdminNotificationsPage,
  }))
);
const AdminPaymentsPage = lazyWithRetry(() =>
  import('../pages/admin/AdminPaymentsPage').then((m) => ({
    default: m.AdminPaymentsPage,
  }))
);
const AdminSettingsPage = lazyWithRetry(() =>
  import('../pages/admin/AdminSettingsPage').then((m) => ({
    default: m.AdminSettingsPage,
  }))
);
const AdminSecurityPage = lazyWithRetry(() =>
  import('../pages/admin/AdminSecurityPage').then((m) => ({
    default: m.AdminSecurityPage,
  }))
);

function RouteLoadingFallback() {
  return (
    <div
      aria-label="Loading page"
      className="flex min-h-[45vh] w-full items-center justify-center px-4 py-12"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#EBD8FF] border-t-[#6A11CB]" />
    </div>
  );
}

function NotFoundView() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <EmptyState
        title={t('pageNotFound')}
        description={t('pageNotFoundDesc')}
        action={
          <Link to="/">
            <Button size="sm" variant="accent">
              {t('goHome')}
            </Button>
          </Link>
        }
      />
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Public Customer Storefront Shell */}
          <Route path="/" element={<StorefrontLayout />}>
            <Route index element={<HomePage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="customize" element={<ShopPage customizableOnly />} />
            <Route path="best-sellers" element={<ShopPage bestSellersOnly />} />
            <Route path="search" element={<ShopPage isSearchPage />} />
            <Route path="categories" element={<AllCategoriesPage />} />
            <Route path="category/:slug" element={<CategoryDetailPage />} />
            <Route path="product/:slug" element={<ProductDetailPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route
              path="order-confirmation/:orderNumber"
              element={<OrderConfirmationPage />}
            />
            <Route path="order/:orderNumber" element={<OrderDetailsPage />} />
            <Route path="addresses" element={<SavedAddressesPage />} />
            <Route path="account" element={<CustomerAccountPage />} />
            <Route path="my-orders" element={<MyOrdersPage />} />
            <Route path="track-order" element={<Navigate to="/my-orders" replace />} />
            <Route path="customization-guide" element={<CustomizationGuidePage />} />
            <Route path="about" element={<AboutUsPage />} />
            <Route path="contact" element={<ContactUsPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route
              path="shipping-policy"
              element={<PolicyPage type="shipping" />}
            />
            <Route
              path="return-policy"
              element={<PolicyPage type="return" />}
            />
            <Route
              path="cancellation-policy"
              element={<PolicyPage type="cancellation" />}
            />
            <Route
              path="privacy-policy"
              element={<PolicyPage type="privacy" />}
            />
            <Route path="terms" element={<PolicyPage type="terms" />} />
            <Route path="*" element={<NotFoundView />} />
          </Route>

          {/* Isolated Mobile-First GiftKart Admin Panel (10 Core Management Pages + More Menu + Login) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <AdminRouteGuard>
                <AdminLayout />
              </AdminRouteGuard>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="more" element={<AdminMorePage />} />
            <Route path="banners" element={<AdminBannerPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="offers" element={<AdminOffersPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="security" element={<AdminSecurityPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
