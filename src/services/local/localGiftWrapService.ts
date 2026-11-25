import type { IGiftWrapService } from '../interfaces';
import type { GiftWrapConfig, GiftWrapStyle } from '../../types';
import {
  ensureServerHydrated,
  getLiveStore,
  saveAdminCollection,
} from '../../storage/serverSync';

export class LocalGiftWrapService implements IGiftWrapService {
  private async readConfig(): Promise<GiftWrapConfig> {
    await ensureServerHydrated();
    return getLiveStore().giftWrapConfig;
  }

  async getConfig(): Promise<GiftWrapConfig> {
    const cfg = await this.readConfig();
    return {
      ...cfg,
      styles: [...cfg.styles].sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  async setGloballyEnabled(enabled: boolean): Promise<GiftWrapConfig> {
    const current = await this.readConfig();
    const next: GiftWrapConfig = { ...current, globallyEnabled: enabled };
    await saveAdminCollection('giftWrapConfig', next, 'giftWrap');
    return next;
  }

  async upsertStyle(style: GiftWrapStyle): Promise<GiftWrapConfig> {
    const current = await this.readConfig();
    const idx = current.styles.findIndex((s) => s.id === style.id);
    const nextStyles = [...current.styles];
    if (idx >= 0) {
      nextStyles[idx] = style;
    } else {
      nextStyles.push(style);
    }
    const next: GiftWrapConfig = { ...current, styles: nextStyles };
    await saveAdminCollection('giftWrapConfig', next, 'giftWrap');
    return next;
  }

  async deleteStyle(styleId: string): Promise<GiftWrapConfig> {
    const current = await this.readConfig();
    const next: GiftWrapConfig = {
      ...current,
      styles: current.styles.filter((s) => s.id !== styleId),
    };
    await saveAdminCollection('giftWrapConfig', next, 'giftWrap');
    return next;
  }
}
