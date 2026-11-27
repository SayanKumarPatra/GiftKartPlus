import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
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

  const hydrate = useCallback(async () => {
    try {
      const [cust, admin, configured] = await Promise.all([
        services.customerAuth.getCurrentAccount(),
        services.adminAuth.getSession(),
        services.adminAuth.isPasscodeConfigured(),
      ]);
      setCustomerAccount(cust);
      setAdminSession(admin);
      setIsAdminPasscodeConfigured(configured);
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  useEffect(() => {
    void hydrate();
    return storeEvents.subscribe((topic) => {
      if (topic === 'auth' || topic === 'customers' || topic === 'all') {
        void hydrate();
      }
    });
  }, [hydrate]);

  const signUpCustomer = useCallback(async (input: CustomerSignUpInput) => {
    const result = await services.customerAuth.signUp(input);
    if (result.account) {
      setCustomerAccount(result.account);
    }
    return result;
  }, []);

  const signInCustomer = useCallback(async (input: CustomerPasswordSignInInput) => {
    const account = await services.customerAuth.signInWithPassword(input);
    setCustomerAccount(account);
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
      setCustomerAccount(updated);
      return updated;
    },
    []
  );

  const signInCustomerDemo = useCallback(async (input: CustomerSignInInput) => {
    const account = await services.customerAuth.signInDemo(input);
    setCustomerAccount(account);
    return account;
  }, []);

  const signOutCustomer = useCallback(async () => {
    await services.customerAuth.signOut();
    setCustomerAccount(null);
  }, []);

  const setupAdminPasscode = useCallback(
    async (input: AdminSignInInput & { displayName?: string }) => {
      const session = await services.adminAuth.setupPasscode(input);
      setAdminSession(session);
      setIsAdminPasscodeConfigured(true);
      return session;
    },
    []
  );

  const signInAdminDemo = useCallback(async (input: AdminSignInInput) => {
    const session = await services.adminAuth.signIn(input);
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
    setAdminSession(updated);
    return updated;
  }, []);

  const signOutAdmin = useCallback(async () => {
    await services.adminAuth.signOut();
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
