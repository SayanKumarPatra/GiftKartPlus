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
  CustomerPasswordSignInInput,
  CustomerProfileUpdateInput,
  CustomerSignInInput,
  CustomerSignUpInput,
  CustomerSignUpResult,
  RegisteredCustomer,
} from '../../types';
import {
  getSupabaseClient,
  isSupabaseSchemaMissingError,
  reportSchemaNotInitializedOnce,
} from '../../lib/supabase';
import { storeEvents } from '../../storage/storeEvents';
import { AUTHORIZED_ADMIN_EMAIL } from '../local/localAuthServices';
import {
  SCHEMA_MIGRATION_HINT,
  mapActivityLogRow,
  mapCustomerRow,
  mapCustomerRowToAccount,
} from './supabaseMappers';

const SUPABASE_ADMIN_SECURITY_NOTE =
  'Protected by Supabase Auth (JWT) and PostgreSQL Row Level Security (admin_users).';

function buildAccountFromAuthUser(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  last_sign_in_at?: string;
}): CustomerDemoAccount {
  const meta = user.user_metadata ?? {};
  const email = (user.email ?? '').trim().toLowerCase();
  const fullName =
    String(meta.full_name ?? meta.name ?? '').trim() ||
    email.split('@')[0] ||
    'GiftKart Customer';

  return {
    id: user.id,
    fullName,
    email,
    phone: String(meta.phone ?? '').trim(),
    defaultCity: String(meta.default_city ?? 'Jalchak').trim() || 'Jalchak',
    avatarUrl:
      typeof meta.avatar_url === 'string' && meta.avatar_url
        ? meta.avatar_url
        : undefined,
    whatsappUpdatesOn: meta.whatsapp_updates_on !== false,
    orderUpdatesOn: meta.order_updates_on !== false,
    offersOn: meta.offers_on !== false,
    isDemoMode: false,
    signedInAt: user.last_sign_in_at ?? new Date().toISOString(),
  };
}

export class SupabaseCustomerDirectoryService implements ICustomerDirectoryService {
  async listCustomers(): Promise<RegisteredCustomer[]> {
    const client = getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) return [];

    const { data, error } = await client
      .from('customers')
      .select('*')
      .order('registered_at', { ascending: false });

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        reportSchemaNotInitializedOnce('customers');
        return [];
      }
      throw new Error(error.message || 'Failed to load customers.');
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapCustomerRow);
  }

  async getCustomerById(customerId: string): Promise<RegisteredCustomer | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .maybeSingle();

    if (error) {
      if (isSupabaseSchemaMissingError(error)) return null;
      throw new Error(error.message || 'Failed to load customer.');
    }
    return data ? mapCustomerRow(data as Record<string, unknown>) : null;
  }

  async getCustomerByEmail(email: string): Promise<RegisteredCustomer | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('customers')
      .select('*')
      .ilike('email', normalized)
      .maybeSingle();

    if (error) {
      if (isSupabaseSchemaMissingError(error)) return null;
      throw new Error(error.message || 'Failed to look up customer.');
    }
    return data ? mapCustomerRow(data as Record<string, unknown>) : null;
  }

  async upsertCustomer(input: {
    id?: string;
    fullName: string;
    email: string;
    phone: string;
    defaultCity?: string;
  }): Promise<RegisteredCustomer> {
    const client = getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    const uid = input.id || sessionData.session?.user?.id;
    if (!uid) {
      throw new Error('Customer must be authenticated to save profile.');
    }

    const { data, error } = await client
      .from('customers')
      .upsert(
        {
          id: uid,
          full_name: input.fullName.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone.trim(),
          default_city: input.defaultCity?.trim() || 'Jalchak',
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to update customer record.');
    }

    storeEvents.emit('customers');
    return mapCustomerRow(data as Record<string, unknown>);
  }

  async setCustomerStatus(
    customerId: string,
    status: CustomerAccountStatus
  ): Promise<RegisteredCustomer> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('customers')
      .update({ status })
      .eq('id', customerId)
      .select('*')
      .single();

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to update customer status.');
    }

    storeEvents.emit('customers');
    return mapCustomerRow(data as Record<string, unknown>);
  }
}

export class SupabaseCustomerAuthService implements ICustomerAuthService {
  readonly isDemoImplementation = false;
  readonly providerLabel = 'Supabase Auth (GiftKart Live)';

  async getCurrentAccount(): Promise<CustomerDemoAccount | null> {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.user) {
      return null;
    }

    const user = data.session.user;
    const email = (user.email ?? '').trim().toLowerCase();
    // Keep primary store admin session separated from customer storefront session
    if (email === AUTHORIZED_ADMIN_EMAIL) {
      return null;
    }

    const { data: row, error: profileErr } = await client
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr) {
      if (isSupabaseSchemaMissingError(profileErr)) {
        reportSchemaNotInitializedOnce('customers');
        return buildAccountFromAuthUser(user);
      }
      return buildAccountFromAuthUser(user);
    }

    if (row) {
      if (row.status === 'BLOCKED') {
        await client.auth.signOut();
        return null;
      }
      return mapCustomerRowToAccount(
        row as Record<string, unknown>,
        user.last_sign_in_at ?? undefined
      );
    }

    return buildAccountFromAuthUser(user);
  }

  async signUp(input: CustomerSignUpInput): Promise<CustomerSignUpResult> {
    const client = getSupabaseClient();
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();
    const phone = (input.phone ?? '').trim();
    const defaultCity = (input.defaultCity ?? 'Jalchak').trim() || 'Jalchak';

    if (email === AUTHORIZED_ADMIN_EMAIL) {
      throw new Error(
        'This email is reserved for the GiftKart store administrator. Please use a customer email.'
      );
    }

    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/account` : undefined;

    const { data, error } = await client.auth.signUp({
      email,
      password: input.password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: fullName,
          phone,
          default_city: defaultCity,
          whatsapp_updates_on: true,
          order_updates_on: true,
          offers_on: true,
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'Unable to create your account right now.');
    }

    if (data.session && data.user) {
      // Ensure customer profile exists even if SQL trigger was added later
      try {
        await client.from('customers').upsert(
          {
            id: data.user.id,
            full_name: fullName,
            email,
            phone,
            default_city: defaultCity,
          },
          { onConflict: 'id' }
        );
      } catch {
        // Ignore if schema migration hasn't been executed yet
      }

      const account = (await this.getCurrentAccount()) ?? buildAccountFromAuthUser(data.user);
      storeEvents.emit('auth');
      storeEvents.emit('customers');
      return {
        account,
        requiresEmailConfirmation: false,
      };
    }

    return {
      account: null,
      requiresEmailConfirmation: true,
      message:
        'Account created! Please check your email inbox and click the confirmation link before logging in.',
    };
  }

  async signInWithPassword(
    input: CustomerPasswordSignInInput
  ): Promise<CustomerDemoAccount> {
    const client = getSupabaseClient();
    const email = input.email.trim().toLowerCase();

    if (email === AUTHORIZED_ADMIN_EMAIL) {
      throw new Error(
        'Please use the GiftKart Admin Panel (/admin/login) to sign in with the administrator account.'
      );
    }

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password: input.password,
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Invalid email or password.');
    }

    const { data: row, error: profileErr } = await client
      .from('customers')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!profileErr && row?.status === 'BLOCKED') {
      await client.auth.signOut();
      throw new Error(
        'Your account has been restricted by the store administrator. Please contact GiftKart support.'
      );
    }

    if (!profileErr && !row) {
      // Backfill profile if user signed up before SQL migration was run
      const fallbackAcc = buildAccountFromAuthUser(data.user);
      await client.from('customers').upsert(
        {
          id: data.user.id,
          full_name: fallbackAcc.fullName,
          email: fallbackAcc.email,
          phone: fallbackAcc.phone,
          default_city: fallbackAcc.defaultCity,
        },
        { onConflict: 'id' }
      );
    }

    const account = (await this.getCurrentAccount()) ?? buildAccountFromAuthUser(data.user);
    storeEvents.emit('auth');
    return account;
  }

  async signInWithGoogle(): Promise<void> {
    const client = getSupabaseClient();
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/account` : undefined;

    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      throw new Error(
        error.message ||
          'Google Sign-In could not be started. Make sure Google provider is enabled in Supabase Auth.'
      );
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    const client = getSupabaseClient();
    const normalized = email.trim().toLowerCase();
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/account?mode=login`
        : undefined;

    const { error } = await client.auth.resetPasswordForEmail(normalized, {
      redirectTo,
    });

    if (error) {
      throw new Error(error.message || 'Unable to send password reset email.');
    }
  }

  async updateProfile(
    input: CustomerProfileUpdateInput
  ): Promise<CustomerDemoAccount> {
    const client = getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      throw new Error('Please sign in to update your profile.');
    }

    const currentMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const nextMeta: Record<string, unknown> = {
      ...currentMeta,
      ...(input.fullName !== undefined ? { full_name: input.fullName.trim() } : {}),
      ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
      ...(input.defaultCity !== undefined
        ? { default_city: input.defaultCity.trim() || 'Jalchak' }
        : {}),
      ...(input.avatarUrl !== undefined ? { avatar_url: input.avatarUrl } : {}),
      ...(input.whatsappUpdatesOn !== undefined
        ? { whatsapp_updates_on: input.whatsappUpdatesOn }
        : {}),
      ...(input.orderUpdatesOn !== undefined
        ? { order_updates_on: input.orderUpdatesOn }
        : {}),
      ...(input.offersOn !== undefined ? { offers_on: input.offersOn } : {}),
    };

    const { error: authErr } = await client.auth.updateUser({ data: nextMeta });
    if (authErr) {
      throw new Error(authErr.message || 'Failed to update account details.');
    }

    const dbPatch: Record<string, unknown> = {};
    if (input.fullName !== undefined) dbPatch.full_name = input.fullName.trim();
    if (input.phone !== undefined) dbPatch.phone = input.phone.trim();
    if (input.defaultCity !== undefined)
      dbPatch.default_city = input.defaultCity.trim() || 'Jalchak';
    if (input.avatarUrl !== undefined) dbPatch.avatar_url = input.avatarUrl;
    if (input.whatsappUpdatesOn !== undefined)
      dbPatch.whatsapp_updates_on = input.whatsappUpdatesOn;
    if (input.orderUpdatesOn !== undefined)
      dbPatch.order_updates_on = input.orderUpdatesOn;
    if (input.offersOn !== undefined) dbPatch.offers_on = input.offersOn;

    if (Object.keys(dbPatch).length > 0) {
      const { error: dbErr } = await client
        .from('customers')
        .update(dbPatch)
        .eq('id', user.id);
      if (dbErr && !isSupabaseSchemaMissingError(dbErr)) {
        throw new Error(dbErr.message || 'Failed to save profile preferences.');
      }
    }

    storeEvents.emit('auth');
    storeEvents.emit('customers');
    const updated = await this.getCurrentAccount();
    if (!updated) {
      throw new Error('Unable to refresh customer profile.');
    }
    return updated;
  }

  async signInDemo(_input: CustomerSignInInput): Promise<CustomerDemoAccount> {
    throw new Error(
      'Demo customer login is disabled. Please sign in with your GiftKart email and password.'
    );
  }

  async signOut(): Promise<void> {
    const client = getSupabaseClient();
    await client.auth.signOut();
    storeEvents.emit('auth');
  }
}

export class SupabaseAdminAuthService implements IAdminAuthService {
  readonly isDemoImplementation = false;
  readonly providerLabel = 'Supabase Auth + RLS Admin';
  readonly securityDisclaimer = SUPABASE_ADMIN_SECURITY_NOTE;
  readonly authorizedEmail = AUTHORIZED_ADMIN_EMAIL;

  async isPasscodeConfigured(): Promise<boolean> {
    // Supabase Auth manages admin credentials centrally
    return true;
  }

  async setupPasscode(
    input: AdminSignInInput & { displayName?: string }
  ): Promise<AdminDemoSession> {
    const email = input.email.trim().toLowerCase();
    const password = input.passcode.trim();
    const displayName = input.displayName?.trim() || 'GiftKart Store Admin';

    if (email !== AUTHORIZED_ADMIN_EMAIL) {
      throw new Error(`Only ${AUTHORIZED_ADMIN_EMAIL} is authorized as store admin.`);
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const client = getSupabaseClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } },
    });

    if (error) {
      throw new Error(error.message || 'Unable to set up admin account.');
    }
    if (!data.session) {
      throw new Error(
        'Admin account created! Please confirm your email in Supabase Auth (or confirm the user in Supabase Dashboard → Authentication → Users) and then log in.'
      );
    }

    const session = await this.getSession();
    if (!session) {
      throw new Error(SCHEMA_MIGRATION_HINT);
    }
    storeEvents.emit('auth');
    return session;
  }

  async getSession(): Promise<AdminDemoSession | null> {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.user) {
      return null;
    }

    const user = data.session.user;
    const email = (user.email ?? '').trim().toLowerCase();
    if (email !== AUTHORIZED_ADMIN_EMAIL) {
      return null;
    }

    const { data: adminRow, error: adminErr } = await client
      .from('admin_users')
      .select('user_id, email, display_name, role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (adminErr) {
      if (isSupabaseSchemaMissingError(adminErr)) {
        reportSchemaNotInitializedOnce('admin_users');
        // Allow viewing Admin UI with clear schema notice if user is authenticated as authorized admin
        return {
          id: user.id,
          email,
          displayName:
            String(user.user_metadata?.full_name ?? '').trim() ||
            'GiftKart Store Admin',
          role: 'SINGLE_ADMIN',
          isDemoMode: false,
          securityDisclaimer: SUPABASE_ADMIN_SECURITY_NOTE,
          signedInAt: user.last_sign_in_at ?? new Date().toISOString(),
        };
      }
      return null;
    }

    if (!adminRow) {
      return null;
    }

    return {
      id: String(adminRow.user_id),
      email: String(adminRow.email),
      displayName: String(adminRow.display_name || 'GiftKart Store Admin'),
      role: 'SINGLE_ADMIN',
      isDemoMode: false,
      securityDisclaimer: SUPABASE_ADMIN_SECURITY_NOTE,
      signedInAt: user.last_sign_in_at ?? new Date().toISOString(),
    };
  }

  async signIn(input: AdminSignInInput): Promise<AdminDemoSession> {
    const email = input.email.trim().toLowerCase();
    const password = input.passcode.trim();

    if (email !== AUTHORIZED_ADMIN_EMAIL) {
      throw new Error(`Only ${AUTHORIZED_ADMIN_EMAIL} is authorized to sign in.`);
    }

    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new Error(
        error?.message === 'Invalid login credentials'
          ? 'Invalid admin email or password. Ensure admin.giftkart@gmail.com exists in Supabase Auth.'
          : error?.message || 'Unable to sign in.'
      );
    }

    const session = await this.getSession();
    if (!session) {
      await client.auth.signOut();
      throw new Error(
        'This account is not listed as an active admin in public.admin_users. Run the SQL migration and ensure admin.giftkart@gmail.com is active.'
      );
    }

    await this.logActivity('Admin Sign In', 'Admin Panel');
    storeEvents.emit('auth');
    storeEvents.emit('all');
    return session;
  }

  async changePasscode(currentPasscode: string, nextPasscode: string): Promise<void> {
    const curr = currentPasscode.trim();
    const next = nextPasscode.trim();
    if (next.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const client = getSupabaseClient();
    const { error: verifyErr } = await client.auth.signInWithPassword({
      email: AUTHORIZED_ADMIN_EMAIL,
      password: curr,
    });
    if (verifyErr) {
      throw new Error('Current password is incorrect.');
    }

    const { error: updateErr } = await client.auth.updateUser({ password: next });
    if (updateErr) {
      throw new Error(updateErr.message || 'Failed to update admin password.');
    }

    await this.logActivity('Changed Admin Password', 'Admin Account');
  }

  async updateProfile(displayName: string): Promise<AdminDemoSession> {
    const trimmed = displayName.trim();
    if (!trimmed) {
      throw new Error('Display name cannot be empty.');
    }

    const client = getSupabaseClient();
    const { data: userData } = await client.auth.getUser();
    const user = userData.user;
    if (!user) {
      throw new Error('Admin sign-in required.');
    }

    await client.auth.updateUser({ data: { full_name: trimmed } });
    const { error } = await client
      .from('admin_users')
      .update({ display_name: trimmed })
      .eq('user_id', user.id);

    if (error && !isSupabaseSchemaMissingError(error)) {
      throw new Error(error.message || 'Failed to update admin profile.');
    }

    await this.logActivity('Updated Admin Profile', trimmed);
    const updated = await this.getSession();
    if (!updated) {
      throw new Error('Unable to refresh admin session.');
    }
    storeEvents.emit('auth');
    return updated;
  }

  async getActivityLogs(): Promise<AdminActivityLog[]> {
    const client = getSupabaseClient();
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) return [];

    const { data, error } = await client
      .from('admin_activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(80);

    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        reportSchemaNotInitializedOnce('admin_activity_logs');
        return [];
      }
      throw new Error(error.message || 'Failed to load activity logs.');
    }

    return ((data ?? []) as Record<string, unknown>[]).map(mapActivityLogRow);
  }

  async logActivity(action: string, target: string): Promise<void> {
    try {
      const client = getSupabaseClient();
      const { data: sessionData } = await client.auth.getSession();
      const email = sessionData.session?.user?.email;
      if (!email || email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL) return;

      await client.from('admin_activity_logs').insert({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action,
        target,
        actor_email: email.toLowerCase(),
        timestamp: new Date().toISOString(),
      });
      storeEvents.emit('activity');
    } catch {
      // Non-blocking audit log
    }
  }

  async clearActivityLogs(): Promise<void> {
    const client = getSupabaseClient();
    const { error } = await client
      .from('admin_activity_logs')
      .delete()
      .neq('id', '');
    if (error) {
      if (isSupabaseSchemaMissingError(error)) {
        throw new Error(SCHEMA_MIGRATION_HINT);
      }
      throw new Error(error.message || 'Failed to clear activity logs.');
    }
    storeEvents.emit('activity');
  }

  async signOut(): Promise<void> {
    const client = getSupabaseClient();
    await client.auth.signOut();
    storeEvents.emit('auth');
  }
}
