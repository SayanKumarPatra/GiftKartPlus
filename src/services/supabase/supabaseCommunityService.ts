import type { ICommunityDataService } from '../local/localCommunityService';
import type {
  NewsletterSubscriber,
  ProductReview,
  SavedAddress,
} from '../../types';
import {
  getSupabaseClient,
  isSupabaseSchemaMissingError,
  reportSchemaNotInitializedOnce,
} from '../../lib/supabase';
import { storeEvents } from '../../storage/storeEvents';
import { LocalCommunityDataService } from '../local/localCommunityService';
import {
  SCHEMA_MIGRATION_HINT,
  mapNewsletterRow,
  mapProductReviewRow,
  mapSavedAddressRow,
} from './supabaseMappers';

export class SupabaseCommunityDataService implements ICommunityDataService {
  private readonly fallback = new LocalCommunityDataService();

  private async getSignedInUserId(): Promise<string | null> {
    const client = getSupabaseClient();
    const { data } = await client.auth.getSession();
    return data.session?.user?.id ?? null;
  }

  async listSavedAddresses(): Promise<SavedAddress[]> {
    const uid = await this.getSignedInUserId();
    if (!uid) {
      return this.fallback.listSavedAddresses();
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', uid)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        reportSchemaNotInitializedOnce('customer_addresses');
        return this.fallback.listSavedAddresses();
      }
      throw new Error(error.message || 'Failed to load saved addresses.');
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapSavedAddressRow);
  }

  async saveAddress(address: SavedAddress): Promise<SavedAddress[]> {
    const uid = await this.getSignedInUserId();
    if (!uid) {
      return this.fallback.saveAddress(address);
    }

    const client = getSupabaseClient();
    const existing = await this.listSavedAddresses();
    const shouldBeDefault = address.isDefault || existing.length === 0;

    if (shouldBeDefault) {
      await client
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', uid);
    }

    const { error } = await client.from('customer_addresses').upsert(
      {
        id: address.id,
        customer_id: uid,
        label: address.label.trim() || 'Home',
        full_name: address.fullName.trim(),
        phone: address.phone.trim(),
        email: address.email.trim(),
        address_line1: address.addressLine1.trim(),
        area: address.area.trim(),
        landmark: address.landmark?.trim() || null,
        delivery_zone_id: address.deliveryZoneId || 'zone-jalchak',
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
        is_default: shouldBeDefault,
        created_at: address.createdAt || new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        return this.fallback.saveAddress(address);
      }
      throw new Error(error.message || 'Failed to save delivery address.');
    }

    storeEvents.emit('community');
    return this.listSavedAddresses();
  }

  async deleteAddress(addressId: string): Promise<SavedAddress[]> {
    const uid = await this.getSignedInUserId();
    if (!uid) {
      return this.fallback.deleteAddress(addressId);
    }

    const client = getSupabaseClient();
    const { error } = await client
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)
      .eq('customer_id', uid);

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        return this.fallback.deleteAddress(addressId);
      }
      throw new Error(error.message || 'Failed to delete address.');
    }

    const remaining = await this.listSavedAddresses();
    if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
      await client
        .from('customer_addresses')
        .update({ is_default: true })
        .eq('id', remaining[0].id)
        .eq('customer_id', uid);
    }

    storeEvents.emit('community');
    return this.listSavedAddresses();
  }

  async setDefaultAddress(addressId: string): Promise<SavedAddress[]> {
    const uid = await this.getSignedInUserId();
    if (!uid) {
      return this.fallback.setDefaultAddress(addressId);
    }

    const client = getSupabaseClient();
    await client
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', uid);

    const { error } = await client
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('customer_id', uid);

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        return this.fallback.setDefaultAddress(addressId);
      }
      throw new Error(error.message || 'Failed to set default address.');
    }

    storeEvents.emit('community');
    return this.listSavedAddresses();
  }

  async listNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    const client = getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) return [];

    const { data, error } = await client
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        reportSchemaNotInitializedOnce('newsletter_subscribers');
        return [];
      }
      throw new Error(error.message || 'Failed to load newsletter subscribers.');
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapNewsletterRow);
  }

  async subscribeNewsletter(
    email: string
  ): Promise<{ added: boolean; subscriber: NewsletterSubscriber }> {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error('Please enter a valid email address.');
    }

    const client = getSupabaseClient();
    const subscriber: NewsletterSubscriber = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: normalized,
      subscribedAt: new Date().toISOString(),
    };

    const { error } = await client.from('newsletter_subscribers').insert({
      id: subscriber.id,
      email: subscriber.email,
      subscribed_at: subscriber.subscribedAt,
    });

    if (error) {
      if (error.code === '23505') {
        return { added: false, subscriber };
      }
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Unable to subscribe right now.');
    }

    storeEvents.emit('community');
    return { added: true, subscriber };
  }

  async listReviews(productId?: string): Promise<ProductReview[]> {
    const client = getSupabaseClient();
    let query = client
      .from('product_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        reportSchemaNotInitializedOnce('product_reviews');
        return [];
      }
      throw new Error(error.message || 'Failed to load product reviews.');
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapProductReviewRow);
  }

  async upsertReview(review: ProductReview): Promise<ProductReview[]> {
    const client = getSupabaseClient();
    const uid = await this.getSignedInUserId();
    if (!uid) {
      throw new Error('Please sign in to submit a product review.');
    }

    const nowIso = new Date().toISOString();
    const payload = {
      id: review.id,
      product_id: review.productId,
      product_name: review.productName,
      order_id: review.orderId ?? null,
      order_number: review.orderNumber ?? null,
      customer_id: uid,
      customer_email: review.customerEmail?.trim().toLowerCase() ?? null,
      customer_phone: review.customerPhone?.trim() ?? null,
      author_name: review.authorName.trim() || 'Verified Customer',
      rating: Math.min(5, Math.max(1, Math.round(Number(review.rating) || 5))),
      comment: review.comment.trim(),
      photos: Array.isArray(review.photos) ? review.photos : [],
      verified_purchase: true,
      is_approved: true,
      created_at: review.createdAt ?? nowIso,
      updated_at: nowIso,
    };

    const { error } = await client
      .from('product_reviews')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      if (error.code === '42501') {
        throw new Error(
          'Reviews can only be submitted after your order for this product has been delivered.'
        );
      }
      throw new Error(error.message || 'Failed to submit review.');
    }

    storeEvents.emit('community');
    return this.listReviews();
  }

  async deleteReview(reviewId: string): Promise<ProductReview[]> {
    const client = getSupabaseClient();
    const { error } = await client.from('product_reviews').delete().eq('id', reviewId);
    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to delete review.');
    }

    storeEvents.emit('community');
    return this.listReviews();
  }
}
