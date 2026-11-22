import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { StorefrontLayout } from '../layouts/StorefrontLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminRouteGuard } from '../components/admin/AdminRouteGuard';
import { HomePage } from '../pages/storefront/HomePage';
import {
  AllCategoriesPage,
  CategoryDetailPage,
  ShopPage,
  WishlistPage,
} from '../pages/storefront/CatalogPages';
import { ProductDetailPage } from '../pages/storefront/ProductDetailPage';
import {
  CartPage,
  CheckoutPage,
  OrderConfirmationPage,
} from '../pages/storefront/CartAndCheckoutPages';
import {
  CustomerAccountPage,
  MyOrdersPage,
  TrackOrderPage,
} from '../pages/storefront/AccountAndOrderPages';
import {
  CustomizationGuidePage,
  OrderDetailsPage,
  SavedAddressesPage,
} from '../pages/storefront/CustomerExtraPages';
import {
  AboutUsPage,
  ContactUsPage,
  FaqPage,
  PolicyPage,
} from '../pages/storefront/InfoAndPolicyPages';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import {
  AdminBannersPage,
  AdminCategoriesPage,
  AdminDashboardPage,
  AdminGiftWrappingPage,
  AdminInventoryPage,
  AdminProductsPage,
} from '../pages/admin/AdminCatalogPages';
import {
  AdminCouponsPage,
  AdminCustomersPage,
  AdminIntegrationsPage,
  AdminOrdersPage,
  AdminReportsPage,
  AdminSettingsPage,
} from '../pages/admin/AdminOperationsPages';
import {
  AdminCustomizationRequestsPage,
  AdminReviewsPage,
  AdminWebsitePagesPage,
} from '../pages/admin/AdminExtraPages';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

function NotFoundView() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <EmptyState
        title="Page not found"
        description="The GiftKart page you requested could not be found."
        action={
          <Link to="/">
            <Button size="sm" variant="accent">
              Return to GiftKart Home
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
      <Routes>
        {/* Public Customer Storefront Shell — All 24 Customer Routes */}
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
          <Route path="track-order" element={<TrackOrderPage />} />
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

        {/* Isolated Single Admin Web Panel (/admin) — All 15 Admin Routes */}
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
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route
            path="customization-requests"
            element={<AdminCustomizationRequestsPage />}
          />
          <Route path="gift-wrapping" element={<AdminGiftWrappingPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="pages" element={<AdminWebsitePagesPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="integrations" element={<AdminIntegrationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
