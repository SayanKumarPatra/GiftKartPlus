import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
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
  AdminDashboardPage,
  AdminMorePage,
} from '../pages/admin/AdminDashboardAndMorePages';
import { AdminBannerPage } from '../pages/admin/AdminBannerPage';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from '../pages/admin/AdminCategoriesPage';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage';
import { AdminOffersPage } from '../pages/admin/AdminOffersPage';
import { AdminCustomersPage } from '../pages/admin/AdminCustomersPage';
import { AdminPaymentsPage } from '../pages/admin/AdminPaymentsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { AdminSecurityPage } from '../pages/admin/AdminSecurityPage';
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
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="security" element={<AdminSecurityPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
