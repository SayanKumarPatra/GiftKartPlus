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

export const AUTHORIZED_ADMIN_EMAIL = 'admin.giftkart@gmail.com';

export const ADMIN_SECURITY_NOTE =
  'Salted SHA-256 browser session active. Ready for Supabase Auth connection when configured.';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSaltHex(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);
    return bytesToHex(buffer);
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

async function hashPasscodeWithSalt(passcode: string, salt: string): Promise<string> {
  const payload = `${salt}:${passcode}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(payload);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return bytesToHex(new Uint8Array(digest));
  }
  // Fallback deterministic digest if Web Crypto is unavailable in an older context
  let hash = 2166136261;
  for (let i = 0; i < payload.length; i += 1) {
    hash ^= payload.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv-${(hash >>> 0).toString(16)}`;
}

function buildCustomerId(email: string): string {
  const clean = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `GK-CUST-${clean.slice(0, 12).toUpperCase() || Date.now().toString(36).toUpperCase()}`;
}

export class LocalCustomerDirectoryService implements ICustomerDirectoryService {
  private readAll(): RegisteredCustomer[] {
    return readStorage<RegisteredCustomer[]>(STORAGE_KEYS.REGISTERED_CUSTOMERS, []);
  }

  async listCustomers(): Promise<RegisteredCustomer[]> {
    const list = this.readAll();
    return [...list].sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
  }

  async getCustomerById(customerId: string): Promise<RegisteredCustomer | null> {
    return this.readAll().find((c) => c.id === customerId) ?? null;
  }

  async getCustomerByEmail(email: string): Promise<RegisteredCustomer | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;
    return this.readAll().find((c) => c.email.toLowerCase() === normalized) ?? null;
  }

  async upsertCustomer(input: {
    id?: string;
    fullName: string;
    email: string;
    phone: string;
    defaultCity?: string;
  }): Promise<RegisteredCustomer> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const cleanPhone = input.phone.trim();
    const cleanName = input.fullName.trim();
    const now = new Date().toISOString();

    const all = this.readAll();
    const existingIndex = all.findIndex(
      (c) =>
        (input.id && c.id === input.id) ||
        (normalizedEmail && c.email.toLowerCase() === normalizedEmail)
    );

    if (existingIndex >= 0) {
      const existing = all[existingIndex];
      const updated: RegisteredCustomer = {
        ...existing,
        fullName: cleanName || existing.fullName,
        phone: cleanPhone || existing.phone,
        defaultCity: input.defaultCity?.trim() || existing.defaultCity || 'Jalchak',
        updatedAt: now,
      };
      const next = [...all];
      next[existingIndex] = updated;
      writeStorage(STORAGE_KEYS.REGISTERED_CUSTOMERS, next, 'customers');
      return updated;
    }

    const created: RegisteredCustomer = {
      id: input.id || buildCustomerId(normalizedEmail || cleanPhone),
      fullName: cleanName || 'Customer',
      email: normalizedEmail,
      phone: cleanPhone,
      defaultCity: input.defaultCity?.trim() || 'Jalchak',
      status: 'ACTIVE',
      registeredAt: now,
      updatedAt: now,
    };

    writeStorage(STORAGE_KEYS.REGISTERED_CUSTOMERS, [created, ...all], 'customers');
    return created;
  }

  async setCustomerStatus(
    customerId: string,
    status: CustomerAccountStatus
  ): Promise<RegisteredCustomer> {
    const all = this.readAll();
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
    writeStorage(STORAGE_KEYS.REGISTERED_CUSTOMERS, next, 'customers');

    // If the currently signed-in customer was blocked, terminate their session immediately
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
  readonly providerLabel = 'GiftKart Customer Account (Supabase Ready)';

  async getCurrentAccount(): Promise<CustomerDemoAccount | null> {
    const current = readStorage<CustomerDemoAccount | null>(
      STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT,
      null
    );
    if (!current) return null;
    const directoryRecord = await sharedCustomerDirectory.getCustomerByEmail(current.email);
    if (directoryRecord?.status === 'BLOCKED') {
      removeStorage(STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT, 'auth');
      return null;
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

    const existing = await sharedCustomerDirectory.getCustomerByEmail(email);
    if (existing?.status === 'BLOCKED') {
      throw new Error(
        'This customer account has been blocked by the store administrator. Please contact support.'
      );
    }

    const syncedCustomer = await sharedCustomerDirectory.upsertCustomer({
      id: existing?.id,
      fullName,
      email,
      phone,
      defaultCity: input.defaultCity || 'Jalchak',
    });

    const account: CustomerDemoAccount = {
      id: syncedCustomer.id,
      fullName: syncedCustomer.fullName,
      email: syncedCustomer.email,
      phone: syncedCustomer.phone,
      defaultCity: syncedCustomer.defaultCity,
      isDemoMode: true,
      signedInAt: new Date().toISOString(),
    };

    writeStorage(STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT, account, 'auth');
    return account;
  }

  async signOut(): Promise<void> {
    removeStorage(STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT, 'auth');
  }
}

export class LocalAdminAuthService implements IAdminAuthService {
  readonly isDemoImplementation = false;
  readonly providerLabel = 'GiftKart Admin Secure Auth (Supabase Ready)';
  readonly securityDisclaimer = ADMIN_SECURITY_NOTE;
  readonly authorizedEmail = AUTHORIZED_ADMIN_EMAIL;

  private readCredentials(): AdminCredentialRecord | null {
    return readStorage<AdminCredentialRecord | null>(
      STORAGE_KEYS.ADMIN_CREDENTIALS,
      null
    );
  }

  private appendActivity(action: string, target: string, actorEmail: string): void {
    const existing = readStorage<AdminActivityLog[]>(STORAGE_KEYS.ADMIN_ACTIVITY_LOGS, []);
    const entry: AdminActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      target,
      actorEmail,
      timestamp: new Date().toISOString(),
    };
    const next = [entry, ...existing].slice(0, 60);
    writeStorage(STORAGE_KEYS.ADMIN_ACTIVITY_LOGS, next, 'activity');
  }

  async isPasscodeConfigured(): Promise<boolean> {
    const record = this.readCredentials();
    return Boolean(record && record.email === AUTHORIZED_ADMIN_EMAIL && record.passcodeHash);
  }

  async setupPasscode(
    input: AdminSignInInput & { displayName?: string }
  ): Promise<AdminDemoSession> {
    const email = input.email.trim().toLowerCase();
    const passcode = input.passcode.trim();

    if (email !== AUTHORIZED_ADMIN_EMAIL) {
      throw new Error(`Unauthorized admin email. Only ${AUTHORIZED_ADMIN_EMAIL} is permitted.`);
    }
    if (passcode.length < 6) {
      throw new Error('Admin password must be at least 6 characters long.');
    }
    const existing = this.readCredentials();
    if (existing && existing.passcodeHash) {
      throw new Error('Admin password is already configured. Please sign in.');
    }

    const salt = generateSaltHex();
    const passcodeHash = await hashPasscodeWithSalt(passcode, salt);
    const now = new Date().toISOString();
    const displayName = input.displayName?.trim() || 'GiftKart Store Admin';

    const record: AdminCredentialRecord = {
      email: AUTHORIZED_ADMIN_EMAIL,
      displayName,
      salt,
      passcodeHash,
      updatedAt: now,
    };
    writeStorage(STORAGE_KEYS.ADMIN_CREDENTIALS, record);

    const session: AdminDemoSession = {
      id: 'admin-giftkart-primary',
      email: AUTHORIZED_ADMIN_EMAIL,
      displayName,
      role: 'SINGLE_ADMIN',
      securityDisclaimer: ADMIN_SECURITY_NOTE,
      signedInAt: now,
    };
    writeStorage(STORAGE_KEYS.ADMIN_DEMO_SESSION, session, 'auth');
    this.appendActivity('Admin Password Configured & Signed In', 'Admin Security', AUTHORIZED_ADMIN_EMAIL);
    return session;
  }

  async getSession(): Promise<AdminDemoSession | null> {
    const session = readStorage<AdminDemoSession | null>(
      STORAGE_KEYS.ADMIN_DEMO_SESSION,
      null
    );
    if (!session) return null;
    if (session.email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL) {
      removeStorage(STORAGE_KEYS.ADMIN_DEMO_SESSION, 'auth');
      return null;
    }
    return session;
  }

  async signIn(input: AdminSignInInput): Promise<AdminDemoSession> {
    const email = input.email.trim().toLowerCase();
    const passcode = input.passcode.trim();

    if (email !== AUTHORIZED_ADMIN_EMAIL) {
      throw new Error('Access denied. Use the authorized GiftKart admin email.');
    }

    const record = this.readCredentials();
    if (!record || !record.passcodeHash) {
      throw new Error('Admin password is not configured yet. Please set up your admin password first.');
    }

    const candidateHash = await hashPasscodeWithSalt(passcode, record.salt);
    if (candidateHash !== record.passcodeHash) {
      throw new Error('Incorrect password. Please try again.');
    }

    const session: AdminDemoSession = {
      id: 'admin-giftkart-primary',
      email: AUTHORIZED_ADMIN_EMAIL,
      displayName: record.displayName || 'GiftKart Store Admin',
      role: 'SINGLE_ADMIN',
      securityDisclaimer: ADMIN_SECURITY_NOTE,
      signedInAt: new Date().toISOString(),
    };
    writeStorage(STORAGE_KEYS.ADMIN_DEMO_SESSION, session, 'auth');
    this.appendActivity('Admin Signed In', 'Admin Panel', AUTHORIZED_ADMIN_EMAIL);
    return session;
  }

  async changePasscode(currentPasscode: string, nextPasscode: string): Promise<void> {
    const record = this.readCredentials();
    if (!record || !record.passcodeHash) {
      throw new Error('No admin password configured.');
    }
    const cleanNext = nextPasscode.trim();
    if (cleanNext.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const currentHash = await hashPasscodeWithSalt(currentPasscode.trim(), record.salt);
    if (currentHash !== record.passcodeHash) {
      throw new Error('Current password is incorrect.');
    }

    const newSalt = generateSaltHex();
    const newHash = await hashPasscodeWithSalt(cleanNext, newSalt);
    const updated: AdminCredentialRecord = {
      ...record,
      salt: newSalt,
      passcodeHash: newHash,
      updatedAt: new Date().toISOString(),
    };
    writeStorage(STORAGE_KEYS.ADMIN_CREDENTIALS, updated);
    this.appendActivity('Admin Password Updated', 'Admin Security', AUTHORIZED_ADMIN_EMAIL);
  }

  async updateProfile(displayName: string): Promise<AdminDemoSession> {
    const clean = displayName.trim();
    if (!clean) {
      throw new Error('Display name cannot be empty.');
    }
    const record = this.readCredentials();
    if (record) {
      writeStorage(STORAGE_KEYS.ADMIN_CREDENTIALS, {
        ...record,
        displayName: clean,
        updatedAt: new Date().toISOString(),
      });
    }
    const session = await this.getSession();
    const updatedSession: AdminDemoSession = {
      id: session?.id || 'admin-giftkart-primary',
      email: AUTHORIZED_ADMIN_EMAIL,
      displayName: clean,
      role: 'SINGLE_ADMIN',
      securityDisclaimer: ADMIN_SECURITY_NOTE,
      signedInAt: session?.signedInAt || new Date().toISOString(),
    };
    writeStorage(STORAGE_KEYS.ADMIN_DEMO_SESSION, updatedSession, 'auth');
    this.appendActivity('Updated Admin Profile', clean, AUTHORIZED_ADMIN_EMAIL);
    return updatedSession;
  }

  async getActivityLogs(): Promise<AdminActivityLog[]> {
    return readStorage<AdminActivityLog[]>(STORAGE_KEYS.ADMIN_ACTIVITY_LOGS, []);
  }

  async logActivity(action: string, target: string): Promise<void> {
    const session = await this.getSession();
    this.appendActivity(action, target, session?.email || AUTHORIZED_ADMIN_EMAIL);
  }

  async clearActivityLogs(): Promise<void> {
    writeStorage(STORAGE_KEYS.ADMIN_ACTIVITY_LOGS, [], 'activity');
  }

  async signOut(): Promise<void> {
    const session = await this.getSession();
    if (session) {
      this.appendActivity('Admin Signed Out', 'Admin Session', session.email);
    }
    removeStorage(STORAGE_KEYS.ADMIN_DEMO_SESSION, 'auth');
  }
}
