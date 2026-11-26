import type { INotificationService } from '../interfaces';
import type { StoreNotification } from '../../types';
import {
  ensureServerHydrated,
  getLiveStore,
  saveAdminCollection,
} from '../../storage/serverSync';

/**
 * Modular storefront notification service.
 * Stores active admin notifications inside storeSettings.notifications (with localStorage fallback).
 * Ready to be swapped for a database / Web Push backend without changing UI consumers.
 */
export class LocalNotificationService implements INotificationService {
  private async readAll(): Promise<StoreNotification[]> {
    await ensureServerHydrated();
    const list = getLiveStore().storeSettings.notifications;
    return Array.isArray(list) ? list : [];
  }

  private async writeAll(next: StoreNotification[]): Promise<void> {
    await ensureServerHydrated();
    const currentSettings = getLiveStore().storeSettings;
    await saveAdminCollection(
      'storeSettings',
      {
        ...currentSettings,
        notifications: next,
      },
      'settings'
    );
  }

  async listNotifications(includeInactive = false): Promise<StoreNotification[]> {
    const all = await this.readAll();
    const sorted = [...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (includeInactive) {
      return sorted;
    }
    return sorted.filter((n) => n.isActive);
  }

  async saveNotification(
    input: Omit<StoreNotification, 'createdAt' | 'updatedAt'> &
      Partial<Pick<StoreNotification, 'createdAt' | 'updatedAt'>>
  ): Promise<StoreNotification> {
    const title = input.title.trim();
    const message = input.message.trim();
    if (!title) {
      throw new Error('Notification title is required.');
    }
    if (!message) {
      throw new Error('Notification message is required.');
    }

    const all = await this.readAll();
    const now = new Date().toISOString();
    const idx = all.findIndex((n) => n.id === input.id);
    const saved: StoreNotification = {
      id: input.id,
      title,
      message,
      targetAudience: 'ALL_REGISTERED_USERS',
      isActive: input.isActive,
      createdAt: idx >= 0 ? all[idx].createdAt : input.createdAt ?? now,
      updatedAt: now,
    };

    const next = [...all];
    if (idx >= 0) {
      next[idx] = saved;
    } else {
      next.unshift(saved);
    }

    await this.writeAll(next);
    return saved;
  }

  async toggleNotification(id: string, isActive: boolean): Promise<StoreNotification | null> {
    const all = await this.readAll();
    const idx = all.findIndex((n) => n.id === id);
    if (idx < 0) return null;
    const updated: StoreNotification = {
      ...all[idx],
      isActive,
      updatedAt: new Date().toISOString(),
    };
    const next = [...all];
    next[idx] = updated;
    await this.writeAll(next);
    return updated;
  }

  async deleteNotification(id: string): Promise<void> {
    const all = await this.readAll();
    const next = all.filter((n) => n.id !== id);
    await this.writeAll(next);
  }
}
