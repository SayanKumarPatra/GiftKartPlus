import type {
  IAdminAuthService,
  ICatalogService,
  ICustomerAuthService,
  ICustomerDirectoryService,
  IGiftWrapService,
  INotificationService,
  IOrderService,
  IPaymentGatewayService,
  IPromotionService,
  IStoreSettingsService,
} from './interfaces';
import { isSupabaseConfigured } from '../lib/supabase';
import { LocalCatalogService } from './local/localCatalogService';
import { LocalGiftWrapService } from './local/localGiftWrapService';
import { LocalNotificationService } from './local/localNotificationService';
import { LocalOrderService } from './local/localOrderService';
import {
  LocalPromotionService,
  LocalStoreSettingsService,
} from './local/localSettingsAndPromoService';
import {
  LocalAdminAuthService,
  LocalCustomerAuthService,
  sharedCustomerDirectory,
} from './local/localAuthServices';
import {
  LocalCommunityDataService,
  type ICommunityDataService,
} from './local/localCommunityService';
import { SupabaseCatalogService } from './supabase/supabaseCatalogService';
import {
  SupabaseGiftWrapService,
  SupabaseNotificationService,
  SupabasePromotionService,
  SupabaseStoreSettingsService,
} from './supabase/supabaseSettingsAndPromoService';
import { SupabaseOrderService } from './supabase/supabaseOrderService';
import {
  SupabaseAdminAuthService,
  SupabaseCustomerAuthService,
  SupabaseCustomerDirectoryService,
} from './supabase/supabaseAuthServices';
import { SupabaseCommunityDataService } from './supabase/supabaseCommunityService';
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
  notifications: INotificationService;
  orders: IOrderService;
  promotions: IPromotionService;
  settings: IStoreSettingsService;
  customers: ICustomerDirectoryService;
  customerAuth: ICustomerAuthService;
  adminAuth: IAdminAuthService;
  paymentGateway: IPaymentGatewayService;
  supabaseContract: typeof supabasePlaceholderAdapter;
  whatsapp: IWhatsAppNotificationService;
  email: IEmailNotificationService;
  analytics: IAnalyticsService;
  community: ICommunityDataService;
}

const useSupabase = isSupabaseConfigured();

export const services: GiftKartServices = {
  catalog: useSupabase ? new SupabaseCatalogService() : new LocalCatalogService(),
  giftWrap: useSupabase ? new SupabaseGiftWrapService() : new LocalGiftWrapService(),
  notifications: useSupabase
    ? new SupabaseNotificationService()
    : new LocalNotificationService(),
  orders: useSupabase ? new SupabaseOrderService() : new LocalOrderService(),
  promotions: useSupabase
    ? new SupabasePromotionService()
    : new LocalPromotionService(),
  settings: useSupabase
    ? new SupabaseStoreSettingsService()
    : new LocalStoreSettingsService(),
  customers: useSupabase
    ? new SupabaseCustomerDirectoryService()
    : sharedCustomerDirectory,
  customerAuth: useSupabase
    ? new SupabaseCustomerAuthService()
    : new LocalCustomerAuthService(),
  adminAuth: useSupabase
    ? new SupabaseAdminAuthService()
    : new LocalAdminAuthService(),
  paymentGateway: new CashfreePlaceholderAdapter(),
  supabaseContract: supabasePlaceholderAdapter,
  whatsapp: whatsappPlaceholderAdapter,
  email: emailPlaceholderAdapter,
  analytics: analyticsPlaceholderAdapter,
  community: useSupabase
    ? new SupabaseCommunityDataService()
    : new LocalCommunityDataService(),
};
