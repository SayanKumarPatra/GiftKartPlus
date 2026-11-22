import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { services } from '../services/registry';
import type {
  AdminDemoSession,
  AdminSignInInput,
  CustomerDemoAccount,
  CustomerSignInInput,
} from '../types';

interface AuthContextValue {
  customerAccount: CustomerDemoAccount | null;
  adminSession: AdminDemoSession | null;
  isAuthReady: boolean;
  customerAuthProviderLabel: string;
  adminAuthProviderLabel: string;
  adminSecurityDisclaimer: string;
  signInCustomerDemo: (input: CustomerSignInInput) => Promise<CustomerDemoAccount>;
  signOutCustomer: () => Promise<void>;
  signInAdminDemo: (input: AdminSignInInput) => Promise<AdminDemoSession>;
  signOutAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customerAccount, setCustomerAccount] = useState<CustomerDemoAccount | null>(null);
  const [adminSession, setAdminSession] = useState<AdminDemoSession | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      try {
        const [cust, admin] = await Promise.all([
          services.customerAuth.getCurrentAccount(),
          services.adminAuth.getSession(),
        ]);
        if (active) {
          setCustomerAccount(cust);
          setAdminSession(admin);
        }
      } finally {
        if (active) {
          setIsAuthReady(true);
        }
      }
    }
    void hydrate();
    return () => {
      active = false;
    };
  }, []);

  const signInCustomerDemo = useCallback(async (input: CustomerSignInInput) => {
    const account = await services.customerAuth.signInDemo(input);
    setCustomerAccount(account);
    return account;
  }, []);

  const signOutCustomer = useCallback(async () => {
    await services.customerAuth.signOut();
    setCustomerAccount(null);
  }, []);

  const signInAdminDemo = useCallback(async (input: AdminSignInInput) => {
    const session = await services.adminAuth.signIn(input);
    setAdminSession(session);
    return session;
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
        customerAuthProviderLabel: services.customerAuth.providerLabel,
        adminAuthProviderLabel: services.adminAuth.providerLabel,
        adminSecurityDisclaimer: services.adminAuth.securityDisclaimer,
        signInCustomerDemo,
        signOutCustomer,
        signInAdminDemo,
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
