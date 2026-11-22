import type {
  IAdminAuthService,
  ICatalogService,
  ICustomerAuthService,
  IGiftWrapService,
  IOrderService,
  IPaymentGatewayService,
  IPromotionService,
  IStoreSettingsService,
} from './interfaces';
import { LocalCatalogService } from './local/localCatalogService';
import { LocalGiftWrapService } from './local/localGiftWrapService';
import { LocalOrderService } from './local/localOrderService';
import {
  LocalPromotionService,
  LocalStoreSettingsService,
} from './local/localSettingsAndPromoService';
import {
  LocalAdminAuthService,
  LocalCustomerAuthService,
} from './local/localAuthServices';
import {
  LocalCommunityDataService,
  type ICommunityDataService,
} from './local/localCommunityService';
import { CashfreePlaceholderAdapter } from './integrations/cashfree.interface';
import { supabasePlaceholderAdapter } from './integrations/supabase.interface';
import {
  whatsappPlaceholderAdapter,
  type IWhatsAppNotificationService,
} from './integrations/whatsapp.interface';
import {
  emailPlaceholderAdapter,
  type IEmailNotificationService,
} from './integrations/email.interface';
import {
  analyticsPlaceholderAdapter,
  type IAnalyticsService,
} from './integrations/analytics.interface';

export interface GiftKartServices {
  catalog: ICatalogService;
  giftWrap: IGiftWrapService;
  orders: IOrderService;
  promotions: IPromotionService;
  settings: IStoreSettingsService;
  customerAuth: ICustomerAuthService;
  adminAuth: IAdminAuthService;
  paymentGateway: IPaymentGatewayService;
  supabaseContract: typeof supabasePlaceholderAdapter;
  whatsapp: IWhatsAppNotificationService;
  email: IEmailNotificationService;
  analytics: IAnalyticsService;
  community: ICommunityDataService;
}

export const services: GiftKartServices = {
  catalog: new LocalCatalogService(),
  giftWrap: new LocalGiftWrapService(),
  orders: new LocalOrderService(),
  promotions: new LocalPromotionService(),
  settings: new LocalStoreSettingsService(),
  customerAuth: new LocalCustomerAuthService(),
  adminAuth: new LocalAdminAuthService(),
  paymentGateway: new CashfreePlaceholderAdapter(),
  supabaseContract: supabasePlaceholderAdapter,
  whatsapp: whatsappPlaceholderAdapter,
  email: emailPlaceholderAdapter,
  analytics: analyticsPlaceholderAdapter,
  community: new LocalCommunityDataService(),
};
