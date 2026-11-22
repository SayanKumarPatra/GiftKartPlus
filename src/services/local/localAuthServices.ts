import type { IAdminAuthService, ICustomerAuthService } from '../interfaces';
import type {
  AdminDemoSession,
  AdminSignInInput,
  CustomerDemoAccount,
  CustomerSignInInput,
} from '../../types';
import {
  STORAGE_KEYS,
  readStorage,
  removeStorage,
  writeStorage,
} from '../../storage/localStorageEngine';

export const DEMO_AUTH_DISCLAIMER =
  'Demo-only browser session stored in LocalStorage. Not production-secure; replace with Supabase Auth before going live.';

export const DEMO_ADMIN_CREDENTIALS = {
  email: 'admin@giftkart.in',
  passcode: 'giftkart-demo',
};

export class LocalCustomerAuthService implements ICustomerAuthService {
  readonly isDemoImplementation = true;
  readonly providerLabel = 'LocalStorage Demo Customer Session (Not Production Auth)';

  async getCurrentAccount(): Promise<CustomerDemoAccount | null> {
    return readStorage<CustomerDemoAccount | null>(
      STORAGE_KEYS.CUSTOMER_DEMO_ACCOUNT,
      null
    );
  }

  async signInDemo(input: CustomerSignInInput): Promise<CustomerDemoAccount> {
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();
    if (!fullName || !email) {
      throw new Error('Please provide your full name and email for the demo session.');
    }
    const account: CustomerDemoAccount = {
      id: `cust-demo-${email.replace(/[^a-z0-9]/g, '')}`,
      fullName,
      email,
      phone: input.phone.trim(),
      defaultCity: input.defaultCity || 'Jalchak',
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
  readonly isDemoImplementation = true;
  readonly providerLabel = 'LocalStorage Single-Admin Demo Session (Not Production Auth)';
  readonly securityDisclaimer = DEMO_AUTH_DISCLAIMER;

  async getSession(): Promise<AdminDemoSession | null> {
    return readStorage<AdminDemoSession | null>(STORAGE_KEYS.ADMIN_DEMO_SESSION, null);
  }

  async signIn(input: AdminSignInInput): Promise<AdminDemoSession> {
    const email = input.email.trim().toLowerCase();
    const passcode = input.passcode.trim();

    if (
      email !== DEMO_ADMIN_CREDENTIALS.email ||
      passcode !== DEMO_ADMIN_CREDENTIALS.passcode
    ) {
      throw new Error(
        `Invalid demo credentials. Use ${DEMO_ADMIN_CREDENTIALS.email} / ${DEMO_ADMIN_CREDENTIALS.passcode}.`
      );
    }

    const session: AdminDemoSession = {
      id: 'admin-single-demo',
      email,
      displayName: 'GiftKart Store Admin',
      role: 'SINGLE_ADMIN',
      isDemoMode: true,
      securityDisclaimer: DEMO_AUTH_DISCLAIMER,
      signedInAt: new Date().toISOString(),
    };
    writeStorage(STORAGE_KEYS.ADMIN_DEMO_SESSION, session, 'auth');
    return session;
  }

  async signOut(): Promise<void> {
    removeStorage(STORAGE_KEYS.ADMIN_DEMO_SESSION, 'auth');
  }
}
