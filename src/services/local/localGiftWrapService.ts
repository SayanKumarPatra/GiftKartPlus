import type { IGiftWrapService } from '../interfaces';
import type { GiftWrapConfig, GiftWrapStyle } from '../../types';
import { STORAGE_KEYS, readStorage, writeStorage } from '../../storage/localStorageEngine';
import { SEED_GIFT_WRAP_CONFIG, ensureDemoSeedHydrated } from '../../data/seedData';

export class LocalGiftWrapService implements IGiftWrapService {
  private readConfig(): GiftWrapConfig {
    ensureDemoSeedHydrated();
    return readStorage<GiftWrapConfig>(STORAGE_KEYS.GIFT_WRAP_CONFIG, SEED_GIFT_WRAP_CONFIG);
  }

  async getConfig(): Promise<GiftWrapConfig> {
    const cfg = this.readConfig();
    return {
      ...cfg,
      styles: [...cfg.styles].sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  async setGloballyEnabled(enabled: boolean): Promise<GiftWrapConfig> {
    const current = this.readConfig();
    const next: GiftWrapConfig = { ...current, globallyEnabled: enabled };
    writeStorage(STORAGE_KEYS.GIFT_WRAP_CONFIG, next, 'giftWrap');
    return next;
  }

  async upsertStyle(style: GiftWrapStyle): Promise<GiftWrapConfig> {
    const current = this.readConfig();
    const idx = current.styles.findIndex((s) => s.id === style.id);
    const nextStyles = [...current.styles];
    if (idx >= 0) {
      nextStyles[idx] = style;
    } else {
      nextStyles.push(style);
    }
    const next: GiftWrapConfig = { ...current, styles: nextStyles };
    writeStorage(STORAGE_KEYS.GIFT_WRAP_CONFIG, next, 'giftWrap');
    return next;
  }

  async deleteStyle(styleId: string): Promise<GiftWrapConfig> {
    const current = this.readConfig();
    const next: GiftWrapConfig = {
      ...current,
      styles: current.styles.filter((s) => s.id !== styleId),
    };
    writeStorage(STORAGE_KEYS.GIFT_WRAP_CONFIG, next, 'giftWrap');
    return next;
  }
}
