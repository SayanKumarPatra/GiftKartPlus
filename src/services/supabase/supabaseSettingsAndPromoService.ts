import type {
  CouponValidationResult,
  IGiftWrapService,
  INotificationService,
  IPromotionService,
  IStoreSettingsService,
} from '../interfaces';
import type {
  Coupon,
  DeliveryZone,
  GiftWrapConfig,
  GiftWrapStyle,
  StoreNotification,
  StoreSettings,
} from '../../types';
import {
  getSupabaseClient,
  isSupabaseSchemaMissingError,
  reportSchemaNotInitializedOnce,
} from '../../lib/supabase';
import { storeEvents } from '../../storage/storeEvents';
import {
  LocalPromotionService,
  LocalStoreSettingsService,
} from '../local/localSettingsAndPromoService';
import { LocalGiftWrapService } from '../local/localGiftWrapService';
import { LocalNotificationService } from '../local/localNotificationService';
import {
  SCHEMA_MIGRATION_HINT,
  mapCouponRow,
  mapGiftWrapStyleRow,
  mapStoreNotificationRow,
  mapStoreSettingsRows,
} from './supabaseMappers';

export class SupabaseStoreSettingsService implements IStoreSettingsService {
  private readonly fallback = new LocalStoreSettingsService();

  async getSettings(): Promise<StoreSettings> {
    const client = getSupabaseClient();
    const [
      { data: settingsRow, error: sErr },
      { data: zoneRows, error: zErr },
      { data: heroRows, error: hErr },
      { data: notifRows, error: nErr },
    ] = await Promise.all([
      client.from('store_settings').select('*').eq('id', 'primary').maybeSingle(),
      client.from('delivery_zones').select('*').order('sort_order', { ascending: true }),
      client.from('hero_banners').select('*').order('sort_order', { ascending: true }),
      client
        .from('store_notifications')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    const firstErr = sErr ?? zErr ?? hErr ?? nErr;
    if (firstErr) {
      if (isSupabaseSchemaMissingError(firstErr)) {
        reportSchemaNotInitializedOnce('store_settings');
        return this.fallback.getSettings();
      }
      throw new Error(firstErr.message || 'Failed to load store settings.');
    }

    const fallbackDefaults = await this.fallback.getSettings();
    return mapStoreSettingsRows(
      (settingsRow as Record<string, unknown> | null) ?? null,
      (zoneRows ?? []) as Record<string, unknown>[],
      (heroRows ?? []) as Record<string, unknown>[],
      (notifRows ?? []) as Record<string, unknown>[],
      fallbackDefaults
    );
  }

  async updateSettings(settings: StoreSettings): Promise<StoreSettings> {
    const client = getSupabaseClient();

    const { error: settingsErr } = await client.from('store_settings').upsert(
      {
        id: 'primary',
        store_name: settings.storeName,
        tagline: settings.tagline,
        logo_url: settings.logoUrl ?? null,
        maintenance_mode: Boolean(settings.maintenanceMode),
        currency_code: settings.currencyCode ?? 'INR',
        currency_symbol: settings.currencySymbol ?? '₹',
        support_email: settings.supportEmail,
        support_phone: settings.supportPhone,
        service_cities_summary: settings.serviceCitiesSummary,
        banner: settings.banner ?? {},
        announcement: settings.announcement ?? {},
        newsletter: settings.newsletter ?? {},
        page_content: settings.pageContent ?? {},
        social_links: settings.socialLinks ?? {},
        seo: settings.seo ?? {},
        policies: settings.policies ?? {},
        footer_content: settings.footerContent ?? {},
        contact_version: Number(settings.contactVersion ?? 2),
      },
      { onConflict: 'id' }
    );

    if (settingsErr) {
      if (isSupabaseSchemaMissingError(settingsErr)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(settingsErr.message || 'Failed to save store settings.');
    }

    // Sync hero_banners table cleanly with settings.heroSlides
    if (Array.isArray(settings.heroSlides)) {
      const incomingBannerIds = settings.heroSlides.map((s) => s.id);
      if (settings.heroSlides.length > 0) {
        const bannerPayload = settings.heroSlides.map((slide, idx) => ({
          id: slide.id,
          title_prefix: slide.titlePrefix ?? '',
          title_highlight: slide.titleHighlight ?? '',
          subtitle: slide.subtitle ?? '',
          cta_label: slide.ctaLabel ?? 'Shop Now',
          cta_href: slide.ctaHref ?? '/shop',
          image_url: slide.imageUrl,
          occasion_tag: slide.occasionTag ?? null,
          is_active: slide.isActive !== false,
          sort_order: Number(slide.sortOrder) || idx + 1,
        }));
        const { error: bannerErr } = await client
          .from('hero_banners')
          .upsert(bannerPayload, { onConflict: 'id' });
        if (bannerErr) {
          throw new Error(bannerErr.message || 'Failed to sync hero banners.');
        }
      }

      const { data: existingBanners } = await client.from('hero_banners').select('id');
      const staleBannerIds = ((existingBanners ?? []) as { id: string }[])
        .map((r) => r.id)
        .filter((id) => !incomingBannerIds.includes(id));
      if (staleBannerIds.length > 0) {
        await client.from('hero_banners').delete().in('id', staleBannerIds);
      }
    }

    // Sync delivery_zones table cleanly with settings.deliveryZones
    if (Array.isArray(settings.deliveryZones)) {
      const incomingZoneIds = settings.deliveryZones.map((z) => z.id);
      if (settings.deliveryZones.length > 0) {
        const zonePayload = settings.deliveryZones.map((z, idx) => ({
          id: z.id,
          name: z.name,
          state: z.state,
          charge_inr: Math.max(0, Number(z.chargeInr) || 0),
          free_delivery_above_inr: Math.max(0, Number(z.freeDeliveryAboveInr) || 0),
          estimated_days: z.estimatedDays,
          is_active: z.isActive !== false,
          sort_order: idx + 1,
        }));
        const { error: zoneErr } = await client
          .from('delivery_zones')
          .upsert(zonePayload, { onConflict: 'id' });
        if (zoneErr) {
          throw new Error(zoneErr.message || 'Failed to sync delivery zones.');
        }
      }

      const { data: existingZones } = await client.from('delivery_zones').select('id');
      const staleZoneIds = ((existingZones ?? []) as { id: string }[])
        .map((r) => r.id)
        .filter((id) => !incomingZoneIds.includes(id));
      if (staleZoneIds.length > 0) {
        await client.from('delivery_zones').delete().in('id', staleZoneIds);
      }
    }

    storeEvents.emit('settings');
    return this.getSettings();
  }

  async upsertDeliveryZone(zone: DeliveryZone): Promise<StoreSettings> {
    const client = getSupabaseClient();
    const { error } = await client.from('delivery_zones').upsert(
      {
        id: zone.id,
        name: zone.name.trim(),
        state: zone.state.trim(),
        charge_inr: Math.max(0, Number(zone.chargeInr) || 0),
        free_delivery_above_inr: Math.max(0, Number(zone.freeDeliveryAboveInr) || 0),
        estimated_days: zone.estimatedDays.trim(),
        is_active: zone.isActive !== false,
      },
      { onConflict: 'id' }
    );

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to save delivery zone.');
    }

    storeEvents.emit('settings');
    return this.getSettings();
  }

  async deleteDeliveryZone(zoneId: string): Promise<StoreSettings> {
    const client = getSupabaseClient();
    const { error } = await client.from('delivery_zones').delete().eq('id', zoneId);
    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to delete delivery zone.');
    }

    storeEvents.emit('settings');
    return this.getSettings();
  }
}

export class SupabasePromotionService implements IPromotionService {
  private readonly fallback = new LocalPromotionService();

  async listCoupons(): Promise<Coupon[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        reportSchemaNotInitializedOnce('coupons');
        return this.fallback.listCoupons();
      }
      throw new Error(error.message || 'Failed to load coupons.');
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapCouponRow);
  }

  async validateCoupon(
    code: string,
    subtotalInr: number
  ): Promise<CouponValidationResult> {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      return { valid: false, discountInr: 0, message: 'Enter a promo code to apply.' };
    }

    const coupons = await this.listCoupons();
    const coupon = coupons.find((c) => c.code.toUpperCase() === normalized && c.isActive);
    if (!coupon) {
      return { valid: false, discountInr: 0, message: 'Promo code is invalid or inactive.' };
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    if (coupon.validFrom && todayIso < coupon.validFrom.slice(0, 10)) {
      return {
        valid: false,
        discountInr: 0,
        message: `Coupon ${coupon.code} starts on ${coupon.validFrom.slice(0, 10)}.`,
      };
    }
    if (coupon.validUntil && todayIso > coupon.validUntil.slice(0, 10)) {
      return {
        valid: false,
        discountInr: 0,
        message: `Coupon ${coupon.code} has expired.`,
      };
    }
    if (subtotalInr < coupon.minOrderInr) {
      return {
        valid: false,
        discountInr: 0,
        message: `Minimum order of ₹${coupon.minOrderInr.toLocaleString('en-IN')} required for ${coupon.code}.`,
      };
    }

    let discountInr =
      coupon.discountType === 'PERCENTAGE'
        ? Math.round((subtotalInr * coupon.value) / 100)
        : coupon.value;

    if (coupon.maxDiscountInr !== undefined) {
      discountInr = Math.min(discountInr, coupon.maxDiscountInr);
    }
    discountInr = Math.min(discountInr, subtotalInr);

    return {
      valid: true,
      coupon,
      discountInr,
      message: `Applied ${coupon.code} — you save ₹${discountInr.toLocaleString('en-IN')}.`,
    };
  }

  async upsertCoupon(coupon: Coupon): Promise<Coupon> {
    const client = getSupabaseClient();
    const normalizedCode = coupon.code.trim().toUpperCase();
    const { data, error } = await client
      .from('coupons')
      .upsert(
        {
          id: coupon.id,
          code: normalizedCode,
          title: coupon.title ?? null,
          description: coupon.description ?? '',
          discount_type: coupon.discountType,
          value: Math.max(1, Number(coupon.value) || 1),
          min_order_inr: Math.max(0, Number(coupon.minOrderInr) || 0),
          max_discount_inr:
            coupon.maxDiscountInr !== undefined && coupon.maxDiscountInr !== null
              ? Math.max(0, Number(coupon.maxDiscountInr) || 0)
              : null,
          valid_from: coupon.validFrom ? coupon.validFrom.slice(0, 10) : null,
          valid_until: coupon.validUntil ? coupon.validUntil.slice(0, 10) : null,
          linked_banner_id: coupon.linkedBannerId || null,
          is_active: coupon.isActive !== false,
          created_at: coupon.createdAt || new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to save coupon.');
    }

    storeEvents.emit('coupons');
    return mapCouponRow(data as Record<string, unknown>);
  }

  async deleteCoupon(couponId: string): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.from('coupons').delete().eq('id', couponId);
    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to delete coupon.');
    }
    storeEvents.emit('coupons');
  }
}

export class SupabaseGiftWrapService implements IGiftWrapService {
  private readonly fallback = new LocalGiftWrapService();

  async getConfig(): Promise<GiftWrapConfig> {
    const client = getSupabaseClient();
    const [{ data: cfg, error: cErr }, { data: styles, error: sErr }] =
      await Promise.all([
        client.from('gift_wrap_config').select('*').eq('id', 'primary').maybeSingle(),
        client
          .from('gift_wrap_styles')
          .select('*')
          .order('sort_order', { ascending: true }),
      ]);

    const firstErr = cErr ?? sErr;
    if (firstErr) {
      if (isSupabaseSchemaMissingError(firstErr)) {
        reportSchemaNotInitializedOnce('gift_wrap_config');
        return this.fallback.getConfig();
      }
      throw new Error(firstErr.message || 'Failed to load gift wrap settings.');
    }

    return {
      globallyEnabled: cfg ? cfg.globally_enabled !== false : true,
      defaultChargeInr: cfg ? Number(cfg.default_charge_inr ?? 49) : 49,
      maxMessageLength: cfg ? Number(cfg.max_message_length ?? 180) : 180,
      styles: ((styles ?? []) as Record<string, unknown>[]).map(mapGiftWrapStyleRow),
    };
  }

  async setGloballyEnabled(enabled: boolean): Promise<GiftWrapConfig> {
    const client = getSupabaseClient();
    const { error } = await client.from('gift_wrap_config').upsert(
      {
        id: 'primary',
        globally_enabled: enabled,
      },
      { onConflict: 'id' }
    );

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to update gift wrap status.');
    }

    storeEvents.emit('giftWrap');
    return this.getConfig();
  }

  async upsertStyle(style: GiftWrapStyle): Promise<GiftWrapConfig> {
    const client = getSupabaseClient();
    const { error } = await client.from('gift_wrap_styles').upsert(
      {
        id: style.id,
        name: style.name.trim(),
        description: style.description ?? '',
        charge_inr: Math.max(0, Number(style.chargeInr) || 0),
        accent_color_hex: style.accentColorHex || '#6A11CB',
        is_active: style.isActive !== false,
        sort_order: Number(style.sortOrder) || 0,
      },
      { onConflict: 'id' }
    );

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to save gift wrap style.');
    }

    storeEvents.emit('giftWrap');
    return this.getConfig();
  }

  async deleteStyle(styleId: string): Promise<GiftWrapConfig> {
    const client = getSupabaseClient();
    const { error } = await client.from('gift_wrap_styles').delete().eq('id', styleId);
    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to delete gift wrap style.');
    }

    storeEvents.emit('giftWrap');
    return this.getConfig();
  }
}

export class SupabaseNotificationService implements INotificationService {
  private readonly fallback = new LocalNotificationService();

  async listNotifications(includeInactive = false): Promise<StoreNotification[]> {
    const client = getSupabaseClient();
    let query = client
      .from('store_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        reportSchemaNotInitializedOnce('store_notifications');
        return this.fallback.listNotifications(includeInactive);
      }
      throw new Error(error.message || 'Failed to load store notifications.');
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapStoreNotificationRow);
  }

  async saveNotification(
    input: Omit<StoreNotification, 'createdAt' | 'updatedAt'> &
      Partial<Pick<StoreNotification, 'createdAt' | 'updatedAt'>>
  ): Promise<StoreNotification> {
    const client = getSupabaseClient();
    const now = new Date().toISOString();
    const { data, error } = await client
      .from('store_notifications')
      .upsert(
        {
          id: input.id,
          title: input.title.trim(),
          message: input.message.trim(),
          target_audience: input.targetAudience ?? 'ALL_REGISTERED_USERS',
          is_active: input.isActive !== false,
          created_at: input.createdAt ?? now,
          updated_at: now,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to save notification.');
    }

    storeEvents.emit('settings');
    return mapStoreNotificationRow(data as Record<string, unknown>);
  }

  async toggleNotification(id: string, isActive: boolean): Promise<StoreNotification | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('store_notifications')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to toggle notification.');
    }

    storeEvents.emit('settings');
    return data ? mapStoreNotificationRow(data as Record<string, unknown>) : null;
  }

  async deleteNotification(id: string): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client.from('store_notifications').delete().eq('id', id);
    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to delete notification.');
    }
    storeEvents.emit('settings');
  }
}
