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
  refreshStoreFromServer,
  saveAdminCollection,
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
    const res = await apiRequest<{ added: boolean; subscriber: NewsletterSubscriber }>(
      '/api/public/newsletter',
      {
        method: 'POST',
        body: { email },
      }
    );
    return res;
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
    const res = await apiRequest<{ reviews: ProductReview[] }>('/api/public/reviews', {
      method: 'POST',
      body: review,
    });
    void refreshStoreFromServer(['community']);
    return res.reviews;
  }

  async deleteReview(reviewId: string): Promise<ProductReview[]> {
    await ensureServerHydrated();
    const next = getLiveStore().productReviews.filter((r) => r.id !== reviewId);
    await saveAdminCollection('productReviews', next, 'community');
    return next;
  }
}
