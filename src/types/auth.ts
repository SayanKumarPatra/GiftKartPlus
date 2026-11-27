export interface CustomerDemoAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  defaultCity: string;
  avatarUrl?: string;
  whatsappUpdatesOn?: boolean;
  orderUpdatesOn?: boolean;
  offersOn?: boolean;
  isDemoMode: boolean;
  signedInAt: string;
}

export interface CustomerSignInInput {
  fullName: string;
  email: string;
  phone: string;
  defaultCity: string;
}

export interface CustomerSignUpInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  defaultCity?: string;
}

export interface CustomerPasswordSignInInput {
  email: string;
  password: string;
}

export interface CustomerSignUpResult {
  account: CustomerDemoAccount | null;
  requiresEmailConfirmation: boolean;
  message?: string;
}

export interface CustomerProfileUpdateInput {
  fullName?: string;
  phone?: string;
  defaultCity?: string;
  avatarUrl?: string | null;
  whatsappUpdatesOn?: boolean;
  orderUpdatesOn?: boolean;
  offersOn?: boolean;
}

export type CustomerAccountStatus = 'ACTIVE' | 'BLOCKED';

export interface RegisteredCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  defaultCity: string;
  status: CustomerAccountStatus;
  registeredAt: string;
  updatedAt: string;
}

export interface AdminDemoSession {
  id: string;
  email: string;
  displayName: string;
  role: 'SINGLE_ADMIN';
  isDemoMode?: boolean;
  securityDisclaimer: string;
  signedInAt: string;
}

export interface AdminSignInInput {
  email: string;
  passcode: string;
}

export interface AdminCredentialRecord {
  email: string;
  displayName: string;
  salt: string;
  passcodeHash: string;
  updatedAt: string;
}

export interface AdminActivityLog {
  id: string;
  action: string;
  target: string;
  actorEmail: string;
  timestamp: string;
}
