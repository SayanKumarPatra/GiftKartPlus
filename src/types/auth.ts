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

export interface AdminDemoSession {
  id: string;
  email: string;
  displayName: string;
  role: 'SINGLE_ADMIN';
  isDemoMode: true;
  securityDisclaimer: string;
  signedInAt: string;
}

export interface AdminSignInInput {
  email: string;
  passcode: string;
}
