export interface CustomerDemoAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  defaultCity: string;
  isDemoMode: true;
  signedInAt: string;
}

export interface CustomerSignInInput {
  fullName: string;
  email: string;
  phone: string;
  defaultCity: string;
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
