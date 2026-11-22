import {
  STORAGE_KEYS,
  readStorage,
  writeStorage,
} from '../../storage/localStorageEngine';
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
    return readStorage<NewsletterSubscriber[]>(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS, []);
  }

  async subscribeNewsletter(
    email: string
  ): Promise<{ added: boolean; subscriber: NewsletterSubscriber }> {
    const clean = email.trim().toLowerCase();
    const existing = readStorage<NewsletterSubscriber[]>(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS, []);
    const found = existing.find((s) => s.email.toLowerCase() === clean);
    if (found) {
      return { added: false, subscriber: found };
    }
    const subscriber: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email: clean,
      subscribedAt: new Date().toISOString(),
    };
    writeStorage(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS, [subscriber, ...existing], 'community');
    return { added: true, subscriber };
  }

  async listReviews(productId?: string): Promise<ProductReview[]> {
    const all = readStorage<ProductReview[]>(STORAGE_KEYS.PRODUCT_REVIEWS, []);
    if (!productId) {
      return all;
    }
    return all.filter((r) => r.productId === productId);
  }

  async upsertReview(review: ProductReview): Promise<ProductReview[]> {
    const all = readStorage<ProductReview[]>(STORAGE_KEYS.PRODUCT_REVIEWS, []);
    const next = all.some((r) => r.id === review.id)
      ? all.map((r) => (r.id === review.id ? review : r))
      : [review, ...all];
    writeStorage(STORAGE_KEYS.PRODUCT_REVIEWS, next, 'community');
    return next;
  }

  async deleteReview(reviewId: string): Promise<ProductReview[]> {
    const all = readStorage<ProductReview[]>(STORAGE_KEYS.PRODUCT_REVIEWS, []);
    const next = all.filter((r) => r.id !== reviewId);
    writeStorage(STORAGE_KEYS.PRODUCT_REVIEWS, next, 'community');
    return next;
  }
}
