import type {
  CouponValidationResult,
  IPromotionService,
  IStoreSettingsService,
} from '../interfaces';
import type { Coupon, DeliveryZone, StoreSettings } from '../../types';
import {
  ensureServerHydrated,
  getLiveStore,
  saveAdminCollection,
} from '../../storage/serverSync';

export class LocalPromotionService implements IPromotionService {
  private async readCoupons(): Promise<Coupon[]> {
    await ensureServerHydrated();
    return getLiveStore().coupons;
  }

  async listCoupons(): Promise<Coupon[]> {
    return this.readCoupons();
  }

  async validateCoupon(code: string, subtotalInr: number): Promise<CouponValidationResult> {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      return { valid: false, discountInr: 0, message: 'Enter a promo code to apply.' };
    }
    const coupons = await this.readCoupons();
    const coupon = coupons.find(
      (c) => c.code.toUpperCase() === normalized && c.isActive
    );
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
    const all = await this.readCoupons();
    const idx = all.findIndex((c) => c.id === coupon.id);
    const normalized: Coupon = { ...coupon, code: coupon.code.trim().toUpperCase() };
    const next = [...all];
    if (idx >= 0) {
      next[idx] = normalized;
    } else {
      next.unshift(normalized);
    }
    await saveAdminCollection('coupons', next, 'coupons');
    return normalized;
  }

  async deleteCoupon(couponId: string): Promise<void> {
    const all = await this.readCoupons();
    const next = all.filter((c) => c.id !== couponId);
    await saveAdminCollection('coupons', next, 'coupons');
  }
}

export class LocalStoreSettingsService implements IStoreSettingsService {
  private async readSettings(): Promise<StoreSettings> {
    await ensureServerHydrated();
    return getLiveStore().storeSettings;
  }

  async getSettings(): Promise<StoreSettings> {
    return this.readSettings();
  }

  async updateSettings(settings: StoreSettings): Promise<StoreSettings> {
    await saveAdminCollection('storeSettings', settings, 'settings');
    return settings;
  }

  async upsertDeliveryZone(zone: DeliveryZone): Promise<StoreSettings> {
    const current = await this.readSettings();
    const idx = current.deliveryZones.findIndex((z) => z.id === zone.id);
    const nextZones = [...current.deliveryZones];
    if (idx >= 0) {
      nextZones[idx] = zone;
    } else {
      nextZones.push(zone);
    }
    const updated: StoreSettings = { ...current, deliveryZones: nextZones };
    await saveAdminCollection('storeSettings', updated, 'settings');
    return updated;
  }

  async deleteDeliveryZone(zoneId: string): Promise<StoreSettings> {
    const current = await this.readSettings();
    const updated: StoreSettings = {
      ...current,
      deliveryZones: current.deliveryZones.filter((z) => z.id !== zoneId),
    };
    await saveAdminCollection('storeSettings', updated, 'settings');
    return updated;
  }
}
