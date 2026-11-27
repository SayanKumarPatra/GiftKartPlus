import type {
  IAdminAuthService,
  ICustomerAuthService,
  ICustomerDirectoryService,
} from '../interfaces';
import type {
  AdminActivityLog,
  AdminCredentialRecord,
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
  STATIC_ADMIN_TOKEN,
  apiRequest,
  clearAdminAuthMemory,
  ensureServerHydrated,
  getAdminBearerToken,
  getCachedAdminSession,
  getLiveStore,
  isBackendUnavailableError,
  isStaticHostMode,
  refreshStoreFromServer,
  saveAdminCollection,
  savePublicLocalCollection,
  setAdminAuthMemory,
} from '../../storage/serverSync';
import { storeEvents } from '../../storage/storeEvents';

export const AUTHORIZED_ADMIN_EMAIL = 'admin.giftkart@gmail.com';

export const ADMIN_SECURITY_NOTE =
  'Secure admin authentication with automatic server sync and static-host support.';

const STATIC_ADMIN_CRED_KEY = 'giftkart:v5:static_admin_cred';
const STATIC_ADMIN_SESSION_KEY = 'giftkart:v5:static_admin_session';

function buildLocalCustomerId(email: string): string {
  const clean = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `GK-CUST-${clean.slice(0, 12).toUpperCase() || Date.now().toString(36).toUpperCase()}`;
}

function generateSaltHex(): string {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 18)}`;
}

async function hashPasscodeWithSalt(passcode: string, salt: string): Promise<string> {
  const material = `giftkart-admin:${salt}:${passcode}`;
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const data = new TextEncoder().encode(material);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback deterministic digest when crypto.subtle is unavailable on non-HTTPS origins
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < material.length; i += 1) {
    const ch = material.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

function readStaticAdminCred(): AdminCredentialRecord | null {
  return readStorage<AdminCredentialRecord | null>(STATIC_ADMIN_CRED_KEY, null);
}

function writeStaticAdminCred(cred: AdminCredentialRecord): void {
  writeStorage(STATIC_ADMIN_CRED_KEY, cred);
}

function readStaticAdminSession(): AdminDemoSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STATIC_ADMIN_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminDemoSession;
  } catch {
    return null;
  }
}

function writeStaticAdminSession(session: AdminDemoSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!session) {
      window.sessionStorage.removeItem(STATIC_ADMIN_SESSION_KEY);
    } else {
      window.sessionStorage.setItem(STATIC_ADMIN_SESSION_KEY, JSON.stringify(session));
    }
  } catch {
    // Ignore sessionStorage restrictions
  }
}

function buildStaticSession(displayName: string): AdminDemoSession {
  return {
    id: 'admin-giftkart-primary',
    email: AUTHORIZED_ADMIN_EMAIL,
    displayName: displayName.trim() || 'GiftKart Store Admin',
    role: 'SINGLE_ADMIN',
    securityDisclaimer: ADMIN_SECURITY_NOTE,
    signedInAt: new Date().toISOString(),
  };
}

function upsertCustomerLocally(input: {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  defaultCity?: string;
}): RegisteredCustomer {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const defaultCity = input.defaultCity?.trim() || 'Jalchak';
  const all = getLiveStore().registeredCustomers;

  const existingIdx = all.findIndex(
    (c) => (input.id && c.id === input.id) || (email && c.email.toLowerCase() === email)
  );
  if (existingIdx >= 0 && all[existingIdx].status === 'BLOCKED') {
    throw new Error(
      'This customer account has been blocked by the store administrator. Please contact support.'
    );
  }

  const now = new Date().toISOString();
  let saved: RegisteredCustomer;
  const next = [...all];
  if (existingIdx >= 0) {
    saved = {
      ...all[existingIdx],
      fullName: fullName || all[existingIdx].fullName,
      phone: phone || all[existingIdx].phone,
      defaultCity: defaultCity || all[existingIdx].defaultCity || 'Jalchak',
      updatedAt: now,
    };
    next[existingIdx] = saved;
  } else {
    saved = {
      id: input.id || buildLocalCustomerId(email || phone),
      fullName: fullName || 'Customer',
      email,
      phone,
      defaultCity,
      status: 'ACTIVE',
      registeredAt: now,
      updatedAt: now,
    };
    next.unshift(saved);
  }

  savePublicLocalCollection('registeredCustomers', next, 'customers');
  return saved;
}

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
    try {
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
    } catch (err) {
      if (isBackendUnavailableError(err)) {
        await ensureServerHydrated();
        return upsertCustomerLocally(input);
      }
      throw err;
    }
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
  readonly providerLabel = 'GiftKart Customer Account (Backend Auth Ready)';

  async getCurrentAccount(): Promise<CustomerDemoAccount | null> {
    const current = readStorage<CustomerDemoAccount | null>(
      STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT,
      null
    );
    if (!current) return null;
    // Purge any legacy mock/demo customer sessions so zero fake user sessions remain
    if (
      current.isDemoMode ||
      current.email?.trim().toLowerCase() === 'sayan.kumar@gmail.com'
    ) {
      removeStorage(STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT, 'auth');
      return null;
    }
    try {
      const status = await apiRequest<{ blocked: boolean }>(
        `/api/public/customers/status?email=${encodeURIComponent(current.email)}`
      );
      if (status.blocked) {
        removeStorage(STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT, 'auth');
        return null;
      }
    } catch (err) {
      if (isBackendUnavailableError(err)) {
        const localCustomer = getLiveStore().registeredCustomers.find(
          (c) => c.email.toLowerCase() === current.email.toLowerCase()
        );
        if (localCustomer?.status === 'BLOCKED') {
          removeStorage(STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT, 'auth');
          return null;
        }
      }
    }
    return current;
  }

  async signInDemo(_input: CustomerSignInInput): Promise<CustomerDemoAccount> {
    throw new Error(
      'Demo customer login has been disabled. Real backend authentication will be connected in the next phase.'
    );
  }

  async signOut(): Promise<void> {
    removeStorage(STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT, 'auth');
  }
}

export class LocalAdminAuthService implements IAdminAuthService {
  readonly isDemoImplementation = false;
  readonly providerLabel = 'GiftKart Admin Secure Auth';
  readonly securityDisclaimer = ADMIN_SECURITY_NOTE;
  readonly authorizedEmail = AUTHORIZED_ADMIN_EMAIL;

  private async appendLocalActivity(action: string, target: string): Promise<void> {
    await ensureServerHydrated();
    const entry: AdminActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      target,
      actorEmail: AUTHORIZED_ADMIN_EMAIL,
      timestamp: new Date().toISOString(),
    };
    const next = [entry, ...getLiveStore().adminActivityLogs].slice(0, 60);
    await saveAdminCollection('adminActivityLogs', next, 'activity');
  }

  async isPasscodeConfigured(): Promise<boolean> {
    try {
      const status = await apiRequest<{ configured: boolean }>('/api/admin/auth/status');
      return Boolean(status.configured);
    } catch (err) {
      if (isBackendUnavailableError(err)) {
        return readStaticAdminCred() !== null;
      }
      return false;
    }
  }

  async setupPasscode(
    input: AdminSignInInput & { displayName?: string }
  ): Promise<AdminDemoSession> {
    const email = input.email.trim().toLowerCase();
    const passcode = input.passcode.trim();
    const displayName = input.displayName?.trim() || 'GiftKart Store Admin';

    try {
      const res = await apiRequest<{ token: string; session: AdminDemoSession }>(
        '/api/admin/auth/setup',
        {
          method: 'POST',
          body: { email, passcode, displayName },
        }
      );

      setAdminAuthMemory(res.token, res.session);
      await refreshStoreFromServer(['all']);
      storeEvents.emit('auth');
      return res.session;
    } catch (err) {
      if (!isBackendUnavailableError(err)) {
        throw err;
      }

      if (email !== AUTHORIZED_ADMIN_EMAIL) {
        throw new Error(`Only ${AUTHORIZED_ADMIN_EMAIL} is authorized as store admin.`);
      }
      if (passcode.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const salt = generateSaltHex();
      const passcodeHash = await hashPasscodeWithSalt(passcode, salt);
      writeStaticAdminCred({
        email: AUTHORIZED_ADMIN_EMAIL,
        displayName,
        salt,
        passcodeHash,
        updatedAt: new Date().toISOString(),
      });

      const session = buildStaticSession(displayName);
      setAdminAuthMemory(STATIC_ADMIN_TOKEN, session);
      writeStaticAdminSession(session);
      await refreshStoreFromServer(['all']);
      await this.appendLocalActivity('Set Admin Password', 'Admin Account');
      storeEvents.emit('auth');
      return session;
    }
  }

  async getSession(): Promise<AdminDemoSession | null> {
    const token = getAdminBearerToken();

    if (!token) {
      // On static hosting (e.g. Vercel), restore active admin session across page refreshes
      const savedStaticSession = readStaticAdminSession();
      if (savedStaticSession) {
        await ensureServerHydrated();
        if (isStaticHostMode() && readStaticAdminCred()) {
          setAdminAuthMemory(STATIC_ADMIN_TOKEN, savedStaticSession);
          return savedStaticSession;
        }
      }
      return null;
    }

    if (token === STATIC_ADMIN_TOKEN) {
      const cached = getCachedAdminSession() ?? readStaticAdminSession();
      if (cached) {
        setAdminAuthMemory(STATIC_ADMIN_TOKEN, cached);
      }
      return cached;
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
    const email = input.email.trim().toLowerCase();
    const passcode = input.passcode.trim();

    try {
      const res = await apiRequest<{ token: string; session: AdminDemoSession }>(
        '/api/admin/auth/login',
        {
          method: 'POST',
          body: { email, passcode },
        }
      );

      setAdminAuthMemory(res.token, res.session);
      await refreshStoreFromServer(['all']);
      storeEvents.emit('auth');
      return res.session;
    } catch (err) {
      if (!isBackendUnavailableError(err)) {
        throw err;
      }

      if (email !== AUTHORIZED_ADMIN_EMAIL) {
        throw new Error(`Only ${AUTHORIZED_ADMIN_EMAIL} is authorized to sign in.`);
      }

      const cred = readStaticAdminCred();
      if (!cred) {
        throw new Error('Admin password is not configured yet. Please set up your password.');
      }

      const expectedHash = await hashPasscodeWithSalt(passcode, cred.salt);
      if (expectedHash !== cred.passcodeHash) {
        throw new Error('Incorrect admin password. Please try again.');
      }

      const session = buildStaticSession(cred.displayName);
      setAdminAuthMemory(STATIC_ADMIN_TOKEN, session);
      writeStaticAdminSession(session);
      await refreshStoreFromServer(['all']);
      await this.appendLocalActivity('Admin Sign In', 'Admin Panel');
      storeEvents.emit('auth');
      return session;
    }
  }

  async changePasscode(currentPasscode: string, nextPasscode: string): Promise<void> {
    const curr = currentPasscode.trim();
    const next = nextPasscode.trim();

    try {
      await apiRequest<{ ok: boolean }>('/api/admin/auth/change-password', {
        method: 'POST',
        body: {
          currentPasscode: curr,
          nextPasscode: next,
        },
        requireAdmin: true,
      });
      await refreshStoreFromServer(['activity']);
    } catch (err) {
      if (!isBackendUnavailableError(err)) {
        throw err;
      }

      const cred = readStaticAdminCred();
      if (!cred) {
        throw new Error('Admin credentials not found.');
      }
      const currentHash = await hashPasscodeWithSalt(curr, cred.salt);
      if (currentHash !== cred.passcodeHash) {
        throw new Error('Current password is incorrect.');
      }
      if (next.length < 6) {
        throw new Error('New password must be at least 6 characters long.');
      }
      const salt = generateSaltHex();
      const passcodeHash = await hashPasscodeWithSalt(next, salt);
      writeStaticAdminCred({
        ...cred,
        salt,
        passcodeHash,
        updatedAt: new Date().toISOString(),
      });
      await this.appendLocalActivity('Changed Admin Password', 'Admin Account');
    }
  }

  async updateProfile(displayName: string): Promise<AdminDemoSession> {
    const trimmed = displayName.trim();
    if (!trimmed) {
      throw new Error('Display name cannot be empty.');
    }

    try {
      const res = await apiRequest<{ token: string; session: AdminDemoSession }>(
        '/api/admin/auth/profile',
        {
          method: 'POST',
          body: { displayName: trimmed },
          requireAdmin: true,
        }
      );
      setAdminAuthMemory(res.token, res.session);
      storeEvents.emit('auth');
      return res.session;
    } catch (err) {
      if (!isBackendUnavailableError(err)) {
        throw err;
      }

      const cred = readStaticAdminCred();
      if (cred) {
        writeStaticAdminCred({
          ...cred,
          displayName: trimmed,
          updatedAt: new Date().toISOString(),
        });
      }
      const current = getCachedAdminSession() ?? buildStaticSession(trimmed);
      const updated: AdminDemoSession = {
        ...current,
        displayName: trimmed,
      };
      setAdminAuthMemory(STATIC_ADMIN_TOKEN, updated);
      writeStaticAdminSession(updated);
      await this.appendLocalActivity('Updated Admin Profile', trimmed);
      storeEvents.emit('auth');
      return updated;
    }
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
    } catch (err) {
      if (isBackendUnavailableError(err)) {
        try {
          await this.appendLocalActivity(action, target);
        } catch {
          // Activity logging should not interrupt primary save actions
        }
      }
    }
  }

  async clearActivityLogs(): Promise<void> {
    try {
      await apiRequest<{ ok: boolean }>('/api/admin/auth/activity', {
        method: 'DELETE',
        requireAdmin: true,
      });
      await refreshStoreFromServer(['activity']);
    } catch (err) {
      if (isBackendUnavailableError(err)) {
        await saveAdminCollection('adminActivityLogs', [], 'activity');
        return;
      }
      throw err;
    }
  }

  async signOut(): Promise<void> {
    const token = getAdminBearerToken();
    if (token && token !== STATIC_ADMIN_TOKEN) {
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
    writeStaticAdminSession(null);
    storeEvents.emit('auth');
  }
}
