import type {
  CouponValidationResult,
  IPromotionService,
  IStoreSettingsService,
} from '../interfaces';
import type { Coupon, DeliveryZone, StoreSettings } from '../../types';
import { STORAGE_KEYS, readStorage, writeStorage } from '../../storage/localStorageEngine';
import {
  SEED_COUPONS,
  SEED_STORE_SETTINGS,
  ensureDemoSeedHydrated,
} from '../../data/seedData';

export class LocalPromotionService implements IPromotionService {
  private readCoupons(): Coupon[] {
    ensureDemoSeedHydrated();
    return readStorage<Coupon[]>(STORAGE_KEYS.COUPONS, SEED_COUPONS);
  }

  async listCoupons(): Promise<Coupon[]> {
    return this.readCoupons();
  }

  async validateCoupon(code: string, subtotalInr: number): Promise<CouponValidationResult> {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      return { valid: false, discountInr: 0, message: 'Enter a promo code to apply.' };
    }
    const coupon = this.readCoupons().find(
      (c) => c.code.toUpperCase() === normalized && c.isActive
    );
    if (!coupon) {
      return { valid: false, discountInr: 0, message: 'Promo code is invalid or inactive.' };
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
    const all = this.readCoupons();
    const idx = all.findIndex((c) => c.id === coupon.id);
    const normalized: Coupon = { ...coupon, code: coupon.code.trim().toUpperCase() };
    const next = [...all];
    if (idx >= 0) {
      next[idx] = normalized;
    } else {
      next.unshift(normalized);
    }
    writeStorage(STORAGE_KEYS.COUPONS, next, 'coupons');
    return normalized;
  }

  async deleteCoupon(couponId: string): Promise<void> {
    const next = this.readCoupons().filter((c) => c.id !== couponId);
    writeStorage(STORAGE_KEYS.COUPONS, next, 'coupons');
  }
}

export class LocalStoreSettingsService implements IStoreSettingsService {
  private readSettings(): StoreSettings {
    ensureDemoSeedHydrated();
    return readStorage<StoreSettings>(STORAGE_KEYS.STORE_SETTINGS, SEED_STORE_SETTINGS);
  }

  async getSettings(): Promise<StoreSettings> {
    return this.readSettings();
  }

  async updateSettings(settings: StoreSettings): Promise<StoreSettings> {
    writeStorage(STORAGE_KEYS.STORE_SETTINGS, settings, 'settings');
    return settings;
  }

  async upsertDeliveryZone(zone: DeliveryZone): Promise<StoreSettings> {
    const current = this.readSettings();
    const idx = current.deliveryZones.findIndex((z) => z.id === zone.id);
    const nextZones = [...current.deliveryZones];
    if (idx >= 0) {
      nextZones[idx] = zone;
    } else {
      nextZones.push(zone);
    }
    const updated: StoreSettings = { ...current, deliveryZones: nextZones };
    writeStorage(STORAGE_KEYS.STORE_SETTINGS, updated, 'settings');
    return updated;
  }

  async deleteDeliveryZone(zoneId: string): Promise<StoreSettings> {
    const current = this.readSettings();
    const updated: StoreSettings = {
      ...current,
      deliveryZones: current.deliveryZones.filter((z) => z.id !== zoneId),
    };
    writeStorage(STORAGE_KEYS.STORE_SETTINGS, updated, 'settings');
    return updated;
  }
}
