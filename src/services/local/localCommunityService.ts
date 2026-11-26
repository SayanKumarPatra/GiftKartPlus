import {
  STORAGE_KEYS,
  readStorage,
  writeStorage,
} from '../../storage/localStorageEngine';
import {
  apiRequest,
  ensureServerHydrated,
  getAdminBearerToken,
  getLiveStore,
  isBackendUnavailableError,
  refreshStoreFromServer,
  saveAdminCollection,
  savePublicLocalCollection,
} from '../../storage/serverSync';
import type {
  NewsletterSubscriber,
  ProductReview,
  SavedAddress,
} from '../../types';

export interface ICommunityDataService {
  listSavedAddresses(): Promise<SavedAddress[]>;
  saveAddress(address: SavedAddress): Promise<SavedAddress[]>;
  deleteAddress(addressId: string): Promise<SavedAddress[]>;
  setDefaultAddress(addressId: string): Promise<SavedAddress[]>;

  listNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;
  subscribeNewsletter(email: string): Promise<{ added: boolean; subscriber: NewsletterSubscriber }>;

  listReviews(productId?: string): Promise<ProductReview[]>;
  upsertReview(review: ProductReview): Promise<ProductReview[]>;
  deleteReview(reviewId: string): Promise<ProductReview[]>;
}

export class LocalCommunityDataService implements ICommunityDataService {
  // Saved delivery addresses stay private per customer's own browser
  async listSavedAddresses(): Promise<SavedAddress[]> {
    return readStorage<SavedAddress[]>(STORAGE_KEYS.SAVED_ADDRESSES, []);
  }

  async saveAddress(address: SavedAddress): Promise<SavedAddress[]> {
    const existing = readStorage<SavedAddress[]>(STORAGE_KEYS.SAVED_ADDRESSES, []);
    let next = existing.some((a) => a.id === address.id)
      ? existing.map((a) => (a.id === address.id ? address : a))
      : [address, ...existing];

    if (address.isDefault || next.length === 1) {
      next = next.map((a) => ({ ...a, isDefault: a.id === address.id }));
    }
    writeStorage(STORAGE_KEYS.SAVED_ADDRESSES, next, 'community');
    return next;
  }

  async deleteAddress(addressId: string): Promise<SavedAddress[]> {
    const existing = readStorage<SavedAddress[]>(STORAGE_KEYS.SAVED_ADDRESSES, []);
    const next = existing.filter((a) => a.id !== addressId);
    if (next.length > 0 && !next.some((a) => a.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    writeStorage(STORAGE_KEYS.SAVED_ADDRESSES, next, 'community');
    return next;
  }

  async setDefaultAddress(addressId: string): Promise<SavedAddress[]> {
    const existing = readStorage<SavedAddress[]>(STORAGE_KEYS.SAVED_ADDRESSES, []);
    const next = existing.map((a) => ({ ...a, isDefault: a.id === addressId }));
    writeStorage(STORAGE_KEYS.SAVED_ADDRESSES, next, 'community');
    return next;
  }

  async listNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    if (!getAdminBearerToken()) {
      return [];
    }
    await ensureServerHydrated();
    return getLiveStore().newsletterSubscribers;
  }

  async subscribeNewsletter(
    email: string
  ): Promise<{ added: boolean; subscriber: NewsletterSubscriber }> {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error('Please enter a valid email address.');
    }

    try {
      const res = await apiRequest<{ added: boolean; subscriber: NewsletterSubscriber }>(
        '/api/public/newsletter',
        {
          method: 'POST',
          body: { email: normalized },
        }
      );
      return res;
    } catch (err) {
      if (!isBackendUnavailableError(err)) {
        throw err;
      }

      await ensureServerHydrated();
      const existing = getLiveStore().newsletterSubscribers;
      const found = existing.find((s) => s.email.toLowerCase() === normalized);
      if (found) {
        return { added: false, subscriber: found };
      }

      const subscriber: NewsletterSubscriber = {
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        email: normalized,
        subscribedAt: new Date().toISOString(),
      };
      savePublicLocalCollection('newsletterSubscribers', [subscriber, ...existing], 'community');
      return { added: true, subscriber };
    }
  }

  async listReviews(productId?: string): Promise<ProductReview[]> {
    await ensureServerHydrated();
    const all = getLiveStore().productReviews;
    if (!productId) {
      return all;
    }
    return all.filter((r) => r.productId === productId);
  }

  async upsertReview(review: ProductReview): Promise<ProductReview[]> {
    try {
      const res = await apiRequest<{ reviews: ProductReview[] }>('/api/public/reviews', {
        method: 'POST',
        body: review,
      });
      void refreshStoreFromServer(['community']);
      return res.reviews;
    } catch (err) {
      if (!isBackendUnavailableError(err)) {
        throw err;
      }

      await ensureServerHydrated();
      const existing = getLiveStore().productReviews;
      const next = existing.some((r) => r.id === review.id)
        ? existing.map((r) => (r.id === review.id ? review : r))
        : [review, ...existing];
      savePublicLocalCollection('productReviews', next, 'community');
      return next;
    }
  }

  async deleteReview(reviewId: string): Promise<ProductReview[]> {
    await ensureServerHydrated();
    const next = getLiveStore().productReviews.filter((r) => r.id !== reviewId);
    await saveAdminCollection('productReviews', next, 'community');
    return next;
  }
}
