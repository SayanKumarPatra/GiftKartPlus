import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { services } from '../services/registry';
import { storeEvents } from '../storage/storeEvents';
import type {
  AdminDemoSession,
  AdminSignInInput,
  CustomerDemoAccount,
  CustomerPasswordSignInInput,
  CustomerProfileUpdateInput,
  CustomerSignInInput,
  CustomerSignUpInput,
  CustomerSignUpResult,
} from '../types';

interface AuthContextValue {
  customerAccount: CustomerDemoAccount | null;
  adminSession: AdminDemoSession | null;
  isAuthReady: boolean;
  isAdminPasscodeConfigured: boolean;
  authorizedAdminEmail: string;
  customerAuthProviderLabel: string;
  adminAuthProviderLabel: string;
  adminSecurityDisclaimer: string;
  signUpCustomer: (input: CustomerSignUpInput) => Promise<CustomerSignUpResult>;
  signInCustomer: (input: CustomerPasswordSignInInput) => Promise<CustomerDemoAccount>;
  signInCustomerWithGoogle: () => Promise<void>;
  sendCustomerPasswordReset: (email: string) => Promise<void>;
  updateCustomerProfile: (
    input: CustomerProfileUpdateInput
  ) => Promise<CustomerDemoAccount>;
  signInCustomerDemo: (input: CustomerSignInInput) => Promise<CustomerDemoAccount>;
  signOutCustomer: () => Promise<void>;
  setupAdminPasscode: (
    input: AdminSignInInput & { displayName?: string }
  ) => Promise<AdminDemoSession>;
  signInAdminDemo: (input: AdminSignInInput) => Promise<AdminDemoSession>;
  changeAdminPasscode: (currentPasscode: string, nextPasscode: string) => Promise<void>;
  updateAdminProfile: (displayName: string) => Promise<AdminDemoSession>;
  signOutAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customerAccount, setCustomerAccount] = useState<CustomerDemoAccount | null>(null);
  const [adminSession, setAdminSession] = useState<AdminDemoSession | null>(null);
  const [isAdminPasscodeConfigured, setIsAdminPasscodeConfigured] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const hydrateSeqRef = useRef(0);

  const hydrate = useCallback(async () => {
    const seq = ++hydrateSeqRef.current;
    try {
      const [custResult, adminResult, configuredResult] = await Promise.allSettled([
        services.customerAuth.getCurrentAccount(),
        services.adminAuth.getSession(),
        services.adminAuth.isPasscodeConfigured(),
      ]);

      // Ignore stale responses if a newer auth update already happened
      if (seq !== hydrateSeqRef.current) return;

      if (custResult.status === 'fulfilled') {
        setCustomerAccount(custResult.value);
      }
      if (adminResult.status === 'fulfilled') {
        setAdminSession(adminResult.value);
      }
      if (configuredResult.status === 'fulfilled') {
        setIsAdminPasscodeConfigured(configuredResult.value);
      }
    } finally {
      if (seq === hydrateSeqRef.current) {
        setIsAuthReady(true);
      }
    }
  }, []);

  useEffect(() => {
    void hydrate();

    // Subscribe to internal store event bus
    const unsubscribeEvents = storeEvents.subscribe((topic) => {
      if (topic === 'auth' || topic === 'customers' || topic === 'all') {
        void hydrate();
      }
    });

    // Subscribe directly to Supabase Auth session lifecycle events so login state
    // survives reloads, token refreshes, OAuth callbacks, Back/Forward, and multi-tab sync
    let unsubscribeSupabaseAuth: (() => void) | undefined;
    if (isSupabaseConfigured()) {
      try {
        const client = getSupabaseClient();
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_OUT') {
            hydrateSeqRef.current += 1;
            setCustomerAccount(null);
            setAdminSession(null);
            setIsAuthReady(true);
            return;
          }

          if (
            event === 'INITIAL_SESSION' ||
            event === 'SIGNED_IN' ||
            event === 'TOKEN_REFRESHED' ||
            event === 'USER_UPDATED'
          ) {
            if (!session) {
              hydrateSeqRef.current += 1;
              setCustomerAccount(null);
              setAdminSession(null);
              setIsAuthReady(true);
              return;
            }
            // Defer Supabase DB queries outside the auth lock callback to prevent deadlocks
            window.setTimeout(() => {
              void hydrate();
            }, 0);
          }
        });
        unsubscribeSupabaseAuth = () => subscription.unsubscribe();
      } catch {
        // Ignore if client cannot initialize
      }
    }

    // Re-sync session cleanly when returning via browser Back/Forward cache (bfcache) or tab focus
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void hydrate();
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void hydrate();
      }
    };
    const handleStorageSync = (event: StorageEvent) => {
      if (event.key === 'giftkart-supabase-auth' || event.key === null) {
        void hydrate();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageSync);

    return () => {
      unsubscribeEvents();
      unsubscribeSupabaseAuth?.();
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, [hydrate]);

  const signUpCustomer = useCallback(async (input: CustomerSignUpInput) => {
    const result = await services.customerAuth.signUp(input);
    if (result.account) {
      hydrateSeqRef.current += 1;
      setCustomerAccount(result.account);
      setIsAuthReady(true);
    }
    return result;
  }, []);

  const signInCustomer = useCallback(async (input: CustomerPasswordSignInInput) => {
    const account = await services.customerAuth.signInWithPassword(input);
    hydrateSeqRef.current += 1;
    setCustomerAccount(account);
    setIsAuthReady(true);
    return account;
  }, []);

  const signInCustomerWithGoogle = useCallback(async () => {
    await services.customerAuth.signInWithGoogle();
  }, []);

  const sendCustomerPasswordReset = useCallback(async (email: string) => {
    await services.customerAuth.sendPasswordReset(email);
  }, []);

  const updateCustomerProfile = useCallback(
    async (input: CustomerProfileUpdateInput) => {
      const updated = await services.customerAuth.updateProfile(input);
      hydrateSeqRef.current += 1;
      setCustomerAccount(updated);
      return updated;
    },
    []
  );

  const signInCustomerDemo = useCallback(async (input: CustomerSignInInput) => {
    const account = await services.customerAuth.signInDemo(input);
    hydrateSeqRef.current += 1;
    setCustomerAccount(account);
    return account;
  }, []);

  const signOutCustomer = useCallback(async () => {
    await services.customerAuth.signOut();
    hydrateSeqRef.current += 1;
    setCustomerAccount(null);
  }, []);

  const setupAdminPasscode = useCallback(
    async (input: AdminSignInInput & { displayName?: string }) => {
      const session = await services.adminAuth.setupPasscode(input);
      hydrateSeqRef.current += 1;
      setAdminSession(session);
      setIsAdminPasscodeConfigured(true);
      return session;
    },
    []
  );

  const signInAdminDemo = useCallback(async (input: AdminSignInInput) => {
    const session = await services.adminAuth.signIn(input);
    hydrateSeqRef.current += 1;
    setAdminSession(session);
    return session;
  }, []);

  const changeAdminPasscode = useCallback(
    async (currentPasscode: string, nextPasscode: string) => {
      await services.adminAuth.changePasscode(currentPasscode, nextPasscode);
    },
    []
  );

  const updateAdminProfile = useCallback(async (displayName: string) => {
    const updated = await services.adminAuth.updateProfile(displayName);
    hydrateSeqRef.current += 1;
    setAdminSession(updated);
    return updated;
  }, []);

  const signOutAdmin = useCallback(async () => {
    await services.adminAuth.signOut();
    hydrateSeqRef.current += 1;
    setAdminSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        customerAccount,
        adminSession,
        isAuthReady,
        isAdminPasscodeConfigured,
        authorizedAdminEmail: services.adminAuth.authorizedEmail,
        customerAuthProviderLabel: services.customerAuth.providerLabel,
        adminAuthProviderLabel: services.adminAuth.providerLabel,
        adminSecurityDisclaimer: services.adminAuth.securityDisclaimer,
        signUpCustomer,
        signInCustomer,
        signInCustomerWithGoogle,
        sendCustomerPasswordReset,
        updateCustomerProfile,
        signInCustomerDemo,
        signOutCustomer,
        setupAdminPasscode,
        signInAdminDemo,
        changeAdminPasscode,
        updateAdminProfile,
        signOutAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
