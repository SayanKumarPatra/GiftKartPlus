import type {
  IAdminAuthService,
  ICustomerAuthService,
  ICustomerDirectoryService,
} from '../interfaces';
import type {
  AdminActivityLog,
  AdminDemoSession,
  AdminSignInInput,
  CustomerAccountStatus,
  CustomerDemoAccount,
  CustomerSignInInput,
  RegisteredCustomer,
} from '../../types';
import {
  STORAGE_KEYS,
  readStorage,
  removeStorage,
  writeStorage,
} from '../../storage/localStorageEngine';
import {
  apiRequest,
  clearAdminAuthMemory,
  ensureServerHydrated,
  getAdminBearerToken,
  getCachedAdminSession,
  getLiveStore,
  refreshStoreFromServer,
  saveAdminCollection,
  setAdminAuthMemory,
} from '../../storage/serverSync';
import { storeEvents } from '../../storage/storeEvents';

export const AUTHORIZED_ADMIN_EMAIL = 'admin.giftkart@gmail.com';

export const ADMIN_SECURITY_NOTE =
  'Server-verified scrypt authentication with live cross-device synchronization.';

export class LocalCustomerDirectoryService implements ICustomerDirectoryService {
  private async readAll(): Promise<RegisteredCustomer[]> {
    if (!getAdminBearerToken()) {
      return [];
    }
    await ensureServerHydrated();
    return getLiveStore().registeredCustomers;
  }

  async listCustomers(): Promise<RegisteredCustomer[]> {
    const list = await this.readAll();
    return [...list].sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
  }

  async getCustomerById(customerId: string): Promise<RegisteredCustomer | null> {
    const list = await this.readAll();
    return list.find((c) => c.id === customerId) ?? null;
  }

  async getCustomerByEmail(email: string): Promise<RegisteredCustomer | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;
    const list = await this.readAll();
    return list.find((c) => c.email.toLowerCase() === normalized) ?? null;
  }

  async upsertCustomer(input: {
    id?: string;
    fullName: string;
    email: string;
    phone: string;
    defaultCity?: string;
  }): Promise<RegisteredCustomer> {
    const res = await apiRequest<{ account: CustomerDemoAccount }>(
      '/api/public/customers/signin',
      {
        method: 'POST',
        body: {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          defaultCity: input.defaultCity || 'Jalchak',
        },
      }
    );
    const now = new Date().toISOString();
    return {
      id: res.account.id,
      fullName: res.account.fullName,
      email: res.account.email,
      phone: res.account.phone,
      defaultCity: res.account.defaultCity,
      status: 'ACTIVE',
      registeredAt: now,
      updatedAt: now,
    };
  }

  async setCustomerStatus(
    customerId: string,
    status: CustomerAccountStatus
  ): Promise<RegisteredCustomer> {
    const all = await this.readAll();
    const idx = all.findIndex((c) => c.id === customerId);
    if (idx < 0) {
      throw new Error('Customer record not found.');
    }
    const updated: RegisteredCustomer = {
      ...all[idx],
      status,
      updatedAt: new Date().toISOString(),
    };
    const next = [...all];
    next[idx] = updated;
    await saveAdminCollection('registeredCustomers', next, 'customers');

    if (status === 'BLOCKED') {
      const current = readStorage<CustomerDemoAccount | null>(
        STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT,
        null
      );
      if (
        current &&
        (current.id === customerId ||
          current.email.toLowerCase() === updated.email.toLowerCase())
      ) {
        removeStorage(STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT, 'auth');
      }
    }

    return updated;
  }
}

export const sharedCustomerDirectory = new LocalCustomerDirectoryService();

export class LocalCustomerAuthService implements ICustomerAuthService {
  readonly isDemoImplementation = false;
  readonly providerLabel = 'GiftKart Customer Account (Live Server Sync)';

  async getCurrentAccount(): Promise<CustomerDemoAccount | null> {
    const current = readStorage<CustomerDemoAccount | null>(
      STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT,
      null
    );
    if (!current) return null;
    try {
      const status = await apiRequest<{ blocked: boolean }>(
        `/api/public/customers/status?email=${encodeURIComponent(current.email)}`
      );
      if (status.blocked) {
        removeStorage(STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT, 'auth');
        return null;
      }
    } catch {
      // Keep local customer session if network briefly drops
    }
    return current;
  }

  async signInDemo(input: CustomerSignInInput): Promise<CustomerDemoAccount> {
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();
    const phone = input.phone.trim();
    if (!fullName || !email) {
      throw new Error('Please provide your full name and email address.');
    }

    const res = await apiRequest<{ account: CustomerDemoAccount }>(
      '/api/public/customers/signin',
      {
        method: 'POST',
        body: {
          fullName,
          email,
          phone,
          defaultCity: input.defaultCity || 'Jalchak',
        },
      }
    );

    writeStorage(STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT, res.account, 'auth');
    return res.account;
  }

  async signOut(): Promise<void> {
    removeStorage(STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT, 'auth');
  }
}

export class LocalAdminAuthService implements IAdminAuthService {
  readonly isDemoImplementation = false;
  readonly providerLabel = 'GiftKart Admin Secure Auth (Live Server)';
  readonly securityDisclaimer = ADMIN_SECURITY_NOTE;
  readonly authorizedEmail = AUTHORIZED_ADMIN_EMAIL;

  async isPasscodeConfigured(): Promise<boolean> {
    try {
      const status = await apiRequest<{ configured: boolean }>('/api/admin/auth/status');
      return Boolean(status.configured);
    } catch {
      return false;
    }
  }

  async setupPasscode(
    input: AdminSignInInput & { displayName?: string }
  ): Promise<AdminDemoSession> {
    const res = await apiRequest<{ token: string; session: AdminDemoSession }>(
      '/api/admin/auth/setup',
      {
        method: 'POST',
        body: {
          email: input.email.trim().toLowerCase(),
          passcode: input.passcode.trim(),
          displayName: input.displayName?.trim() || 'GiftKart Store Admin',
        },
      }
    );

    setAdminAuthMemory(res.token, res.session);
    await refreshStoreFromServer(['all']);
    storeEvents.emit('auth');
    return res.session;
  }

  async getSession(): Promise<AdminDemoSession | null> {
    const token = getAdminBearerToken();
    if (!token) {
      return null;
    }
    const cached = getCachedAdminSession();
    try {
      const res = await apiRequest<{ session: AdminDemoSession }>('/api/admin/auth/me', {
        requireAdmin: true,
      });
      setAdminAuthMemory(token, res.session);
      return res.session;
    } catch {
      if (!getAdminBearerToken()) {
        return null;
      }
      return cached;
    }
  }

  async signIn(input: AdminSignInInput): Promise<AdminDemoSession> {
    const res = await apiRequest<{ token: string; session: AdminDemoSession }>(
      '/api/admin/auth/login',
      {
        method: 'POST',
        body: {
          email: input.email.trim().toLowerCase(),
          passcode: input.passcode.trim(),
        },
      }
    );

    setAdminAuthMemory(res.token, res.session);
    await refreshStoreFromServer(['all']);
    storeEvents.emit('auth');
    return res.session;
  }

  async changePasscode(currentPasscode: string, nextPasscode: string): Promise<void> {
    await apiRequest<{ ok: boolean }>('/api/admin/auth/change-password', {
      method: 'POST',
      body: {
        currentPasscode: currentPasscode.trim(),
        nextPasscode: nextPasscode.trim(),
      },
      requireAdmin: true,
    });
    await refreshStoreFromServer(['activity']);
  }

  async updateProfile(displayName: string): Promise<AdminDemoSession> {
    const res = await apiRequest<{ token: string; session: AdminDemoSession }>(
      '/api/admin/auth/profile',
      {
        method: 'POST',
        body: { displayName: displayName.trim() },
        requireAdmin: true,
      }
    );
    setAdminAuthMemory(res.token, res.session);
    storeEvents.emit('auth');
    return res.session;
  }

  async getActivityLogs(): Promise<AdminActivityLog[]> {
    if (!getAdminBearerToken()) {
      return [];
    }
    await ensureServerHydrated();
    return getLiveStore().adminActivityLogs;
  }

  async logActivity(action: string, target: string): Promise<void> {
    if (!getAdminBearerToken()) return;
    try {
      await apiRequest<{ ok: boolean }>('/api/admin/auth/activity', {
        method: 'POST',
        body: { action, target },
        requireAdmin: true,
      });
    } catch {
      // Activity logging should not interrupt primary save actions
    }
  }

  async clearActivityLogs(): Promise<void> {
    await apiRequest<{ ok: boolean }>('/api/admin/auth/activity', {
      method: 'DELETE',
      requireAdmin: true,
    });
    await refreshStoreFromServer(['activity']);
  }

  async signOut(): Promise<void> {
    if (getAdminBearerToken()) {
      try {
        await apiRequest<{ ok: boolean }>('/api/admin/auth/logout', {
          method: 'POST',
          requireAdmin: true,
        });
      } catch {
        // Proceed with local memory cleanup
      }
    }
    clearAdminAuthMemory();
    storeEvents.emit('auth');
  }
}
