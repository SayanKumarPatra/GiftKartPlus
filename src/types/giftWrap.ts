export interface GiftWrapStyle {
  id: string;
  name: string;
  description: string;
  chargeInr: number;
  accentColorHex: string;
  isActive: boolean;
  sortOrder: number;
}

export interface GiftWrapSelection {
  enabled: boolean;
  styleId: string | null;
  styleNameSnapshot: string;
  chargeInrSnapshot: number;
  recipientName: string;
  giftMessage: string;
}

export interface GiftWrapConfig {
  globallyEnabled: boolean;
  defaultChargeInr: number;
  maxMessageLength: number;
  styles: GiftWrapStyle[];
}
