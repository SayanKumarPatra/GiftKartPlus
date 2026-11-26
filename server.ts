import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';
const AUTHORIZED_ADMIN_EMAIL = 'admin.giftkart@gmail.com';
const ADMIN_SECURITY_NOTE =
  'Server-verified scrypt authentication with live cross-device store synchronization.';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'giftkart-store.json');
const AUTH_FILE = path.join(DATA_DIR, 'giftkart-auth.json');

// Session signing key: uses env secret if set, otherwise a fresh in-memory random 32-byte key
const SESSION_SIGNING_KEY =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16
    ? process.env.SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const revokedTokenIds = new Set<string>();

interface AdminAuthRecord {
  email: string;
  displayName: string;
  salt: string;
  passcodeHash: string;
  updatedAt: string;
}

interface AdminSessionPayload {
  jti: string;
  email: string;
  displayName: string;
  signedInAt: string;
  exp: number;
}

interface StoreDatabase {
  version: number;
  updatedAt: string;
  categories: unknown[];
  products: unknown[];
  storeSettings: Record<string, unknown>;
  giftWrapConfig: Record<string, unknown>;
  coupons: unknown[];
  orders: Record<string, unknown>[];
  registeredCustomers: Record<string, unknown>[];
  productReviews: Record<string, unknown>[];
  newsletterSubscribers: Record<string, unknown>[];
  adminActivityLogs: Record<string, unknown>[];
}

const DEFAULT_CATEGORIES = [
  {
    id: 'cat-all-gifts',
    slug: 'all-gifts',
    name: 'All Gifts',
    description: 'Explore every personalized and curated gift collection across GiftKart.',
    imageUrl: '/assets/aistudio/Glossy_Purple_Gift_Box_with_Golden_Bow-edited_09de3fec.png',
    sortOrder: 1,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-photo-frame',
    slug: 'photo-frame',
    name: 'Photo Frame',
    description:
      'Memory frames across Normal, LED Lighting, Stone Print, Crystal, Collage, Wooden, and Acrylic finishes.',
    imageUrl: '/assets/aistudio/Romantic_Framed_Couple_on_Golden_Pedestal_ac3f2968.png',
    sortOrder: 2,
    isActive: true,
    subcategories: [
      { id: 'sub-frame-normal', slug: 'normal', name: 'Normal', isActive: true, sortOrder: 1 },
      { id: 'sub-frame-led', slug: 'led-lighting', name: 'LED Lighting', isActive: true, sortOrder: 2 },
      { id: 'sub-frame-stone', slug: 'stone-print', name: 'Stone Print', isActive: true, sortOrder: 3 },
      { id: 'sub-frame-crystal', slug: 'crystal', name: 'Crystal', isActive: true, sortOrder: 4 },
      { id: 'sub-frame-collage', slug: 'collage', name: 'Collage', isActive: true, sortOrder: 5 },
      { id: 'sub-frame-wooden', slug: 'wooden', name: 'Wooden', isActive: true, sortOrder: 6 },
      { id: 'sub-frame-acrylic', slug: 'acrylic', name: 'Acrylic', isActive: true, sortOrder: 7 },
    ],
  },
  {
    id: 'cat-coffee-mugs',
    slug: 'coffee-mugs',
    name: 'Coffee Mugs',
    description: 'Custom ceramic, magic heat-reveal, photo, couple, and name-printed coffee mugs.',
    imageUrl: '/assets/aistudio/Festive_Red_Ribbon_Coffee_Mug_195c9bba.png',
    sortOrder: 3,
    isActive: true,
    subcategories: [
      { id: 'sub-mug-normal', slug: 'normal-mug', name: 'Normal Mug', isActive: true, sortOrder: 1 },
      { id: 'sub-mug-magic', slug: 'magic-mug', name: 'Magic Mug', isActive: true, sortOrder: 2 },
      { id: 'sub-mug-photo', slug: 'photo-mug', name: 'Photo Mug', isActive: true, sortOrder: 3 },
      { id: 'sub-mug-couple', slug: 'couple-mug', name: 'Couple Mug', isActive: true, sortOrder: 4 },
      { id: 'sub-mug-name', slug: 'name-printed', name: 'Name Printed', isActive: true, sortOrder: 5 },
      { id: 'sub-mug-color', slug: 'color-changing', name: 'Color Changing', isActive: true, sortOrder: 6 },
    ],
  },
  {
    id: 'cat-tshirt-prints',
    slug: 't-shirt-prints',
    name: 'T-shirt Prints',
    description:
      'Custom printed T-shirts in Regular, Infinity, Leather Print, Couple, Name, Oversized, and Polo styles.',
    imageUrl: '/assets/aistudio/Tropical_Sunset_T-Shirt_on_Golden_Display_cf5d3e8e.png',
    sortOrder: 4,
    isActive: true,
    subcategories: [
      { id: 'sub-tshirt-regular', slug: 'regular', name: 'Regular', isActive: true, sortOrder: 1 },
      { id: 'sub-tshirt-infinity', slug: 'infinity', name: 'Infinity', isActive: true, sortOrder: 2 },
      { id: 'sub-tshirt-leather', slug: 'leather-print', name: 'Leather Print', isActive: true, sortOrder: 3 },
      { id: 'sub-tshirt-couple', slug: 'couple', name: 'Couple', isActive: true, sortOrder: 4 },
      { id: 'sub-tshirt-name', slug: 'name', name: 'Name', isActive: true, sortOrder: 5 },
      { id: 'sub-tshirt-oversized', slug: 'oversized', name: 'Oversized', isActive: true, sortOrder: 6 },
      { id: 'sub-tshirt-polo', slug: 'polo', name: 'Polo', isActive: true, sortOrder: 7 },
    ],
  },
  {
    id: 'cat-home-decor',
    slug: 'home-decor',
    name: 'Home Decor',
    description: 'Custom wall clocks, tabletop nameplates, photo keepsakes, and home decor accents.',
    imageUrl: '/assets/aistudio/Warm_Buddha_Moonlight_Decor_Display_c24a114f.png',
    sortOrder: 5,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-hand-made',
    slug: 'hand-made',
    name: 'Hand Made',
    description: 'Artisan explosion boxes, scrapbook albums, and handcrafted personalized keepsakes.',
    imageUrl: '/src/assets/images/category_handmade_gift_1795289475494.jpg',
    sortOrder: 6,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-keychain',
    slug: 'keychain',
    name: 'KeyChain',
    description: 'Engraved metal, acrylic photo, and wooden monogram keychains.',
    imageUrl: '/assets/aistudio/Golden_Pedestal_Keychain_Collection_b507d441.png',
    sortOrder: 7,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-gifts-bag-box',
    slug: 'gifts-bag-box',
    name: 'Gifts Bag + Box',
    description: 'Signature rigid presentation gift boxes, hampers, and boutique ribbon gift bags.',
    imageUrl: '/assets/aistudio/Luxury_Purple_Valentine_Gift_Hamper_7db1384e.png',
    sortOrder: 8,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-led-lighting',
    slug: 'led-lighting',
    name: 'LED Lighting',
    description: 'Custom 3D heart photo lamps, moon lamps, and warm acrylic bedside keepsakes.',
    imageUrl: '/assets/aistudio/Romantic_Moonlight_Couple_Lamp_Gift_Set_a4d8a6f1.png',
    sortOrder: 9,
    isActive: true,
    subcategories: [],
  },
  {
    id: 'cat-pvc-card',
    slug: 'pvc-card',
    name: 'PVC Card',
    description: 'Custom printed glossy PVC photo cards, wallet keepsake cards, and personalized ID cards.',
    imageUrl: '/src/assets/images/category_pvc_card_1795608982570.jpg',
    sortOrder: 10,
    isActive: true,
    subcategories: [],
  },
];

const DEFAULT_GIFT_WRAP_CONFIG = {
  globallyEnabled: true,
  defaultChargeInr: 79,
  maxMessageLength: 220,
  styles: [
    {
      id: 'wrap-lavender-silk',
      name: 'Royal Lavender Silk',
      description: 'Matte lavender boutique wrap tied with deep purple satin ribbon and wax seal.',
      chargeInr: 79,
      accentColorHex: '#6A11CB',
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'wrap-rose-ribbon',
      name: 'Rose Pink Celebration',
      description: 'Pearl white textured paper layered with vibrant pink silk bow and message card.',
      chargeInr: 99,
      accentColorHex: '#FF4D8D',
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'wrap-white-pearl',
      name: 'Minimal Pearl White',
      description: 'Crisp cotton-finish white wrap with soft lavender cord and handwritten tag.',
      chargeInr: 59,
      accentColorHex: '#EBD8FF',
      isActive: true,
      sortOrder: 3,
    },
    {
      id: 'wrap-festive-foil',
      name: 'Festive Keepsake Foil',
      description: 'Heavyweight blush-lavender celebration wrap with shimmer bow for milestones.',
      chargeInr: 129,
      accentColorHex: '#9333EA',
      isActive: true,
      sortOrder: 4,
    },
  ],
};

const DEFAULT_STORE_SETTINGS = {
  storeName: 'GiftKart',
  tagline: 'Har Gift Mein Ek Kahani.',
  logoUrl: '',
  maintenanceMode: false,
  currencyCode: 'INR',
  currencySymbol: '₹',
  supportEmail: 'hello.giftkart@gmail.com',
  supportPhone: '+91 9239505791',
  serviceCitiesSummary: 'Jalchak, West Bengal',
  deliveryZones: [
    {
      id: 'zone-jalchak',
      name: 'Jalchak',
      state: 'West Bengal',
      chargeInr: 49,
      freeDeliveryAboveInr: 999,
      estimatedDays: '1–2 business days',
      isActive: true,
    },
  ],
  banner: {
    enabled: true,
    headline: 'Har Gift Mein Ek Kahani.',
    subheadline: 'Personalized gifts crafted with love for Jalchak.',
    ctaLabel: 'Shop Now',
    ctaHref: '/shop',
  },
  heroSlides: [],
  announcement: {
    enabled: true,
    desktopText: 'Delivery in Jalchak • Custom Photo & Name Gifts Available',
    mobileText: 'Serving Jalchak • Personalized Gifts',
    showSupportLink: true,
    showTrackOrderLink: true,
  },
  newsletter: {
    enabled: true,
    heading: 'Stay Connected with GiftKart',
    description:
      'Get new personalized gift ideas, seasonal collections, and launch announcements for Jalchak.',
    buttonLabel: 'Subscribe',
  },
  pageContent: {
    aboutHeadline: 'Har Gift Mein Ek Kahani.',
    aboutStory:
      'GiftKart is an online personalized gift and accessories storefront crafted for Jalchak, West Bengal. Every mug, T-shirt print, illuminated photo frame, and boutique gift hamper is prepared with attention to personal memories.',
    customizationHeadline: 'How GiftKart Customization Works',
    customizationNote:
      'Select your preferred product variant, add your custom name, date, or dedication note, and attach a clear photo preview. Optional boutique gift wrapping and personal message cards can be configured directly in your Gift Bag.',
  },
  socialLinks: {
    instagram: 'https://www.instagram.com/giftkart.online',
    facebook: 'https://www.facebook.com/share/18v7Ev2crP/',
    whatsapp: 'https://wa.me/919239505791',
    youtube: '',
  },
  seo: {
    title: 'GiftKart — Har Gift Mein Ek Kahani | Personalized Gift Store',
    description:
      'Shop personalized photo frames, custom coffee mugs, T-shirt prints, LED lighting, handmade gifts, and gift hampers in Jalchak, West Bengal.',
  },
  policies: {
    privacyPolicy:
      'GiftKart collects only the information required to process, personalize, and deliver your orders (such as your name, contact number, email address, delivery address, and uploaded customization photos). Your data is never sold to third parties.',
    termsAndConditions:
      'All customized gift items are produced specifically according to the text, photos, and options submitted at checkout. Please review spelling and image clarity carefully before placing your order.',
    refundPolicy:
      'Non-customized, unused products in original packaging are eligible for return or refund within 7 days of delivery. Personalized or customized items containing customer-uploaded photos, names, or custom text are strictly non-returnable and non-refundable unless damaged on arrival.',
  },
  footerContent: {
    description:
      'Personalized photo frames, custom coffee mugs, printed T-shirts, handmade keepsakes, and curated gift boxes delivered across Jalchak.',
    copyrightText: '© 2026 GiftKart. All rights reserved.',
  },
};

function createDefaultStore(): StoreDatabase {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    categories: DEFAULT_CATEGORIES,
    products: [],
    storeSettings: DEFAULT_STORE_SETTINGS,
    giftWrapConfig: DEFAULT_GIFT_WRAP_CONFIG,
    coupons: [],
    orders: [],
    registeredCustomers: [],
    productReviews: [],
    newsletterSubscribers: [],
    adminActivityLogs: [],
  };
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function atomicWriteJson(filePath: string, payload: unknown): void {
  ensureDataDir();
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

function loadStoreFromDisk(): StoreDatabase {
  ensureDataDir();
  if (!fs.existsSync(STORE_FILE)) {
    const initial = createDefaultStore();
    atomicWriteJson(STORE_FILE, initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreDatabase>;
    const defaults = createDefaultStore();
    return {
      version: typeof parsed.version === 'number' ? parsed.version : 1,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : defaults.updatedAt,
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories
        : defaults.categories,
      products: Array.isArray(parsed.products) ? parsed.products : [],
      storeSettings:
        parsed.storeSettings && typeof parsed.storeSettings === 'object'
          ? { ...defaults.storeSettings, ...parsed.storeSettings }
          : defaults.storeSettings,
      giftWrapConfig:
        parsed.giftWrapConfig && typeof parsed.giftWrapConfig === 'object'
          ? { ...defaults.giftWrapConfig, ...parsed.giftWrapConfig }
          : defaults.giftWrapConfig,
      coupons: Array.isArray(parsed.coupons) ? parsed.coupons : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      registeredCustomers: Array.isArray(parsed.registeredCustomers)
        ? parsed.registeredCustomers
        : [],
      productReviews: Array.isArray(parsed.productReviews) ? parsed.productReviews : [],
      newsletterSubscribers: Array.isArray(parsed.newsletterSubscribers)
        ? parsed.newsletterSubscribers
        : [],
      adminActivityLogs: Array.isArray(parsed.adminActivityLogs) ? parsed.adminActivityLogs : [],
    };
  } catch (err) {
    console.error('[GiftKart Server] Failed to parse store file, initializing clean store:', err);
    const initial = createDefaultStore();
    atomicWriteJson(STORE_FILE, initial);
    return initial;
  }
}

function loadAuthRecord(): AdminAuthRecord | null {
  ensureDataDir();
  if (!fs.existsSync(AUTH_FILE)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(AUTH_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AdminAuthRecord>;
    if (
      parsed &&
      parsed.email === AUTHORIZED_ADMIN_EMAIL &&
      typeof parsed.salt === 'string' &&
      typeof parsed.passcodeHash === 'string' &&
      parsed.passcodeHash.length > 0
    ) {
      return {
        email: parsed.email,
        displayName: parsed.displayName || 'GiftKart Store Admin',
        salt: parsed.salt,
        passcodeHash: parsed.passcodeHash,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function saveAuthRecord(record: AdminAuthRecord): void {
  atomicWriteJson(AUTH_FILE, record);
}

function hashPasswordScrypt(password: string, saltHex: string): string {
  const derived = crypto.scryptSync(password, saltHex, 64);
  return derived.toString('hex');
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function getEnvAdminPasscode(): string {
  return typeof process.env.ADMIN_PASSCODE === 'string' ? process.env.ADMIN_PASSCODE.trim() : '';
}

function signAdminToken(payload: AdminSessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SIGNING_KEY)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyAdminToken(token: string): AdminSessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, providedSig] = parts;
  if (!encoded || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', SESSION_SIGNING_KEY)
    .update(encoded)
    .digest('base64url');

  if (!timingSafeStringEqual(providedSig, expectedSig)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as AdminSessionPayload;
    if (
      !payload ||
      payload.email !== AUTHORIZED_ADMIN_EMAIL ||
      typeof payload.exp !== 'number' ||
      payload.exp < Date.now() ||
      revokedTokenIds.has(payload.jti)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7).trim() || null;
}

function buildAdminSessionResponse(payload: AdminSessionPayload) {
  return {
    id: 'admin-giftkart-primary',
    email: AUTHORIZED_ADMIN_EMAIL,
    displayName: payload.displayName || 'GiftKart Store Admin',
    role: 'SINGLE_ADMIN' as const,
    securityDisclaimer: ADMIN_SECURITY_NOTE,
    signedInAt: payload.signedInAt,
  };
}

function sanitizeHrefOrImage(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (/^(javascript|vbscript):/i.test(trimmed)) {
    return '';
  }
  if (/^data:/i.test(trimmed) && !/^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,/i.test(trimmed)) {
    return '';
  }
  return value;
}

function sanitizeDeepStrings(input: unknown): unknown {
  if (typeof input === 'string') {
    return sanitizeHrefOrImage(input);
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeDeepStrings(item));
  }
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') {
        continue;
      }
      out[k] = sanitizeDeepStrings(v);
    }
    return out;
  }
  return input;
}

function buildCustomerId(email: string): string {
  const clean = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `GK-CUST-${clean.slice(0, 12).toUpperCase() || Date.now().toString(36).toUpperCase()}`;
}

function generateOrderNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `GK-${year}-${String(sequence).padStart(4, '0')}`;
}

let storeDb: StoreDatabase = loadStoreFromDisk();

// Real-time Server-Sent Events clients connected across all devices (mobile + desktop)
const sseClients = new Set<Response>();

function broadcastStoreUpdate(topics: string[]): void {
  const message = JSON.stringify({
    type: 'store:updated',
    topics,
    version: storeDb.version,
    updatedAt: storeDb.updatedAt,
  });
  const frame = `data: ${message}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(frame);
    } catch {
      sseClients.delete(client);
    }
  }
}

function commitStoreChange(topics: string[]): void {
  storeDb.version += 1;
  storeDb.updatedAt = new Date().toISOString();
  atomicWriteJson(STORE_FILE, storeDb);
  broadcastStoreUpdate(topics);
}

function appendAdminLog(action: string, target: string, actorEmail = AUTHORIZED_ADMIN_EMAIL): void {
  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    target,
    actorEmail,
    timestamp: new Date().toISOString(),
  };
  storeDb.adminActivityLogs = [entry, ...storeDb.adminActivityLogs].slice(0, 60);
  commitStoreChange(['activity']);
}

function upsertCustomerRecord(input: {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  defaultCity?: string;
}): Record<string, unknown> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const cleanPhone = input.phone.trim();
  const cleanName = input.fullName.trim();
  const now = new Date().toISOString();

  const existingIdx = storeDb.registeredCustomers.findIndex(
    (c) =>
      (input.id && c.id === input.id) ||
      (normalizedEmail && String(c.email ?? '').toLowerCase() === normalizedEmail)
  );

  if (existingIdx >= 0) {
    const existing = storeDb.registeredCustomers[existingIdx];
    const updated = {
      ...existing,
      fullName: cleanName || existing.fullName,
      phone: cleanPhone || existing.phone,
      defaultCity: input.defaultCity?.trim() || existing.defaultCity || 'Jalchak',
      updatedAt: now,
    };
    storeDb.registeredCustomers[existingIdx] = updated;
    return updated;
  }

  const created = {
    id: input.id || buildCustomerId(normalizedEmail || cleanPhone),
    fullName: cleanName || 'Customer',
    email: normalizedEmail,
    phone: cleanPhone,
    defaultCity: input.defaultCity?.trim() || 'Jalchak',
    status: 'ACTIVE',
    registeredAt: now,
    updatedAt: now,
  };
  storeDb.registeredCustomers = [created, ...storeDb.registeredCustomers];
  return created;
}

interface AuthedRequest extends Request {
  adminPayload?: AdminSessionPayload;
}

function requireAdminAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Admin sign-in required. Please log in again.' });
    return;
  }
  const payload = verifyAdminToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Admin session expired. Please sign in again.' });
    return;
  }
  req.adminPayload = payload;
  next();
}

const COLLECTION_TOPICS: Record<string, { topic: string; expectArray: boolean }> = {
  categories: { topic: 'catalog', expectArray: true },
  products: { topic: 'catalog', expectArray: true },
  storeSettings: { topic: 'settings', expectArray: false },
  giftWrapConfig: { topic: 'giftWrap', expectArray: false },
  coupons: { topic: 'coupons', expectArray: true },
  orders: { topic: 'orders', expectArray: true },
  registeredCustomers: { topic: 'customers', expectArray: true },
  productReviews: { topic: 'community', expectArray: true },
  newsletterSubscribers: { topic: 'community', expectArray: true },
  adminActivityLogs: { topic: 'activity', expectArray: true },
};

async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '50mb' }));

  // Prevent browser/proxy caching of dynamic API responses
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-GiftKart-Backend', '1');
    next();
  });

  // =========================================================================
  // 1. REAL-TIME LIVE SYNC STREAM (SSE — Desktop & Mobile Stay In Sync)
  // =========================================================================
  app.get('/api/store/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const initPayload = JSON.stringify({
      type: 'connected',
      version: storeDb.version,
      updatedAt: storeDb.updatedAt,
    });
    res.write(`data: ${initPayload}\n\n`);

    sseClients.add(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // =========================================================================
  // 2. PUBLIC STOREFRONT DATA (Banners, Products, Categories, Offers, Reviews)
  // =========================================================================
  app.get('/api/store/public', (_req, res) => {
    res.json({
      version: storeDb.version,
      updatedAt: storeDb.updatedAt,
      data: {
        categories: storeDb.categories,
        products: storeDb.products,
        storeSettings: storeDb.storeSettings,
        giftWrapConfig: storeDb.giftWrapConfig,
        coupons: storeDb.coupons,
        productReviews: storeDb.productReviews,
      },
    });
  });

  // =========================================================================
  // 3. PUBLIC CUSTOMER ACTIONS (Sign-In, Order Placement, Track, Cancel, Reviews)
  // =========================================================================
  app.get('/api/public/customers/status', (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      res.json({ blocked: false });
      return;
    }
    const found = storeDb.registeredCustomers.find(
      (c) => String(c.email || '').toLowerCase() === email
    );
    res.json({ blocked: found?.status === 'BLOCKED' });
  });

  app.post('/api/public/customers/signin', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const fullName = String(body?.fullName || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const phone = String(body?.phone || '').trim();
    const defaultCity = String(body?.defaultCity || 'Jalchak').trim();

    if (!fullName || !email) {
      res.status(400).json({ error: 'Please provide your full name and email address.' });
      return;
    }

    const existing = storeDb.registeredCustomers.find(
      (c) => String(c.email || '').toLowerCase() === email
    );
    if (existing?.status === 'BLOCKED') {
      res.status(403).json({
        error:
          'This customer account has been blocked by the store administrator. Please contact support.',
      });
      return;
    }

    const synced = upsertCustomerRecord({
      id: typeof existing?.id === 'string' ? existing.id : undefined,
      fullName,
      email,
      phone,
      defaultCity,
    });
    commitStoreChange(['customers']);

    res.json({
      account: {
        id: synced.id,
        fullName: synced.fullName,
        email: synced.email,
        phone: synced.phone,
        defaultCity: synced.defaultCity,
        isDemoMode: false,
        signedInAt: new Date().toISOString(),
      },
    });
  });

  app.post('/api/public/orders', (req, res) => {
    const input = sanitizeDeepStrings(req.body) as Record<string, unknown>;
    const customer = (input?.customer || {}) as Record<string, unknown>;
    const items = Array.isArray(input?.items) ? (input.items as Record<string, unknown>[]) : [];
    const giftWrap = (input?.giftWrap || {}) as Record<string, unknown>;

    const customerEmail = String(customer.email || '').trim().toLowerCase();
    const customerName = String(customer.fullName || '').trim();
    const customerPhone = String(customer.phone || '').trim();

    if (!customerName || !customerPhone || items.length === 0) {
      res.status(400).json({ error: 'Order requires customer name, phone, and at least one item.' });
      return;
    }

    if (customerEmail) {
      const existingCustomer = storeDb.registeredCustomers.find(
        (c) => String(c.email || '').toLowerCase() === customerEmail
      );
      if (existingCustomer?.status === 'BLOCKED') {
        res.status(403).json({
          error: 'Your account has been restricted by the administrator and cannot place new orders.',
        });
        return;
      }
    }

    const syncedCustomer = upsertCustomerRecord({
      id: typeof input.customerAccountId === 'string' ? input.customerAccountId : undefined,
      fullName: customerName,
      email: customerEmail,
      phone: customerPhone,
      defaultCity: String(customer.city || 'Jalchak'),
    });

    const now = new Date().toISOString();
    const sequence = storeDb.orders.length + 1;
    const orderNumber = generateOrderNumber(sequence);

    const frozenItems = items.map((item) => {
      const unitPrice = Number(item.unitPriceInrSnapshot) || 0;
      const qty = Math.max(1, Number(item.quantity) || 1);
      return {
        productId: String(item.productId || ''),
        productNameSnapshot: String(item.productNameSnapshot || 'Gift Item'),
        productSkuSnapshot: String(item.productSkuSnapshot || ''),
        unitPriceInrSnapshot: unitPrice,
        quantity: qty,
        lineTotalInr: unitPrice * qty,
        selectedVariants:
          item.selectedVariants && typeof item.selectedVariants === 'object'
            ? item.selectedVariants
            : {},
        personalizationDetails: item.personalizationDetails,
        customPhotoFileName: item.customPhotoFileName,
        imageSnapshot: item.imageSnapshot,
      };
    });

    const wrapEnabled = Boolean(giftWrap.enabled);
    const wrapCharge = wrapEnabled ? Number(giftWrap.chargeInrSnapshot) || 0 : 0;
    const frozenGiftWrap = {
      enabled: wrapEnabled,
      styleId: giftWrap.styleId,
      styleNameSnapshot: giftWrap.styleNameSnapshot,
      chargeInrSnapshot: wrapCharge,
      recipientName: giftWrap.recipientName,
      giftMessage: giftWrap.giftMessage,
    };

    const paymentStatus =
      input.paymentStatus === 'PAID' ||
      input.paymentStatus === 'FAILED' ||
      input.paymentStatus === 'REFUNDED'
        ? input.paymentStatus
        : 'PENDING';

    const newOrder: Record<string, unknown> = {
      id: `ord-${Date.now()}-${sequence}`,
      orderNumber,
      mode: 'LIVE_ORDER',
      customerAccountId: syncedCustomer.id,
      customer: { ...customer },
      items: frozenItems,
      giftWrap: frozenGiftWrap,
      subtotalInr: Number(input.subtotalInr) || 0,
      giftWrapChargeInr: wrapCharge,
      discountInr: Number(input.discountInr) || 0,
      deliveryChargeInr: Number(input.deliveryChargeInr) || 0,
      grandTotalInr: Number(input.grandTotalInr) || 0,
      couponCode: input.couponCode,
      paymentMethod: String(input.paymentMethod || 'Cash on Delivery (COD)'),
      paymentStatus,
      paymentReference: `TXN-${orderNumber.replace(/[^A-Z0-9]/g, '')}`,
      paymentGatewayStatus: 'CASHFREE_NOT_CONNECTED',
      fulfillmentStatus: 'New',
      statusHistory: [
        {
          status: 'New',
          timestamp: now,
          note: 'Order received and awaiting store review.',
          updatedBy: 'System',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    storeDb.orders = [newOrder, ...storeDb.orders];
    commitStoreChange(['orders', 'customers']);
    res.status(201).json({ order: newOrder });
  });

  app.get('/api/public/orders/track', (req, res) => {
    const orderNumber = String(req.query.orderNumber || '').trim().toUpperCase();
    if (!orderNumber) {
      res.json({ order: null });
      return;
    }
    const found =
      storeDb.orders.find((o) => String(o.orderNumber || '').toUpperCase() === orderNumber) ??
      null;
    res.json({ order: found });
  });

  app.get('/api/public/orders/customer', (req, res) => {
    const accountId = String(req.query.accountId || '').trim();
    if (!accountId) {
      res.json({ orders: [] });
      return;
    }
    const matching = storeDb.orders
      .filter((o) => o.customerAccountId === accountId)
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    res.json({ orders: matching });
  });

  app.post('/api/public/orders/:orderId/cancel', (req, res) => {
    const orderId = String(req.params.orderId || '');
    const reason = String((req.body as Record<string, unknown>)?.reason || '').trim();
    const accountId = String((req.body as Record<string, unknown>)?.customerAccountId || '').trim();

    const idx = storeDb.orders.findIndex((o) => o.id === orderId);
    if (idx < 0) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    const target = storeDb.orders[idx];
    if (target.customerAccountId && target.customerAccountId !== accountId) {
      res.status(403).json({ error: 'You do not have permission to cancel this order.' });
      return;
    }
    if (target.fulfillmentStatus !== 'New' && target.fulfillmentStatus !== 'Demo Placed') {
      res.status(400).json({ error: 'Order cannot be cancelled once processing has started.' });
      return;
    }

    const now = new Date().toISOString();
    const existingHistory = Array.isArray(target.statusHistory) ? target.statusHistory : [];
    const updated = {
      ...target,
      fulfillmentStatus: 'Cancelled',
      statusHistory: [
        ...existingHistory,
        {
          status: 'Cancelled',
          timestamp: now,
          note: reason || 'Cancelled by customer before processing.',
          updatedBy: 'Customer',
        },
      ],
      updatedAt: now,
    };
    storeDb.orders[idx] = updated;
    commitStoreChange(['orders']);
    res.json({ order: updated });
  });

  app.post('/api/public/newsletter', (req, res) => {
    const clean = String((req.body as Record<string, unknown>)?.email || '')
      .trim()
      .toLowerCase();
    if (!clean || !clean.includes('@')) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    const existing = storeDb.newsletterSubscribers.find(
      (s) => String(s.email || '').toLowerCase() === clean
    );
    if (existing) {
      res.json({ added: false, subscriber: existing });
      return;
    }
    const subscriber = {
      id: `sub-${Date.now()}`,
      email: clean,
      subscribedAt: new Date().toISOString(),
    };
    storeDb.newsletterSubscribers = [subscriber, ...storeDb.newsletterSubscribers];
    commitStoreChange(['community']);
    res.status(201).json({ added: true, subscriber });
  });

  app.post('/api/public/reviews', (req, res) => {
    const review = sanitizeDeepStrings(req.body) as Record<string, unknown>;
    if (!review?.id || !review?.productId || !review?.comment) {
      res.status(400).json({ error: 'Invalid review data.' });
      return;
    }
    const exists = storeDb.productReviews.some((r) => r.id === review.id);
    storeDb.productReviews = exists
      ? storeDb.productReviews.map((r) => (r.id === review.id ? review : r))
      : [review, ...storeDb.productReviews];
    commitStoreChange(['community']);
    res.json({ reviews: storeDb.productReviews });
  });

  // =========================================================================
  // 4. SERVER-SIDE ADMIN AUTHENTICATION (Shared Across Desktop & Mobile)
  // =========================================================================
  app.get('/api/admin/auth/status', (_req, res) => {
    const envPasscode = getEnvAdminPasscode();
    const record = loadAuthRecord();
    const configured = Boolean(envPasscode || record?.passcodeHash);
    res.json({
      configured,
      authorizedEmail: AUTHORIZED_ADMIN_EMAIL,
      hasEnvOverride: Boolean(envPasscode),
    });
  });

  app.post('/api/admin/auth/setup', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const email = String(body?.email || '').trim().toLowerCase();
    const passcode = String(body?.passcode || '').trim();
    const displayName = String(body?.displayName || 'GiftKart Store Admin').trim();

    if (email !== AUTHORIZED_ADMIN_EMAIL) {
      res
        .status(403)
        .json({ error: `Unauthorized admin email. Only ${AUTHORIZED_ADMIN_EMAIL} is permitted.` });
      return;
    }
    if (passcode.length < 6) {
      res.status(400).json({ error: 'Admin password must be at least 6 characters long.' });
      return;
    }
    if (getEnvAdminPasscode() || loadAuthRecord()?.passcodeHash) {
      res.status(409).json({ error: 'Admin password is already configured. Please sign in.' });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passcodeHash = hashPasswordScrypt(passcode, salt);
    const now = new Date().toISOString();

    saveAuthRecord({
      email: AUTHORIZED_ADMIN_EMAIL,
      displayName: displayName || 'GiftKart Store Admin',
      salt,
      passcodeHash,
      updatedAt: now,
    });

    const payload: AdminSessionPayload = {
      jti: crypto.randomBytes(16).toString('hex'),
      email: AUTHORIZED_ADMIN_EMAIL,
      displayName: displayName || 'GiftKart Store Admin',
      signedInAt: now,
      exp: Date.now() + TOKEN_TTL_MS,
    };
    const token = signAdminToken(payload);
    appendAdminLog('Admin Password Configured & Signed In', 'Admin Security');

    res.json({
      token,
      session: buildAdminSessionResponse(payload),
    });
  });

  app.post('/api/admin/auth/login', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const email = String(body?.email || '').trim().toLowerCase();
    const passcode = String(body?.passcode || '').trim();

    if (email !== AUTHORIZED_ADMIN_EMAIL) {
      res.status(403).json({ error: 'Access denied. Use the authorized GiftKart admin email.' });
      return;
    }

    const envPasscode = getEnvAdminPasscode();
    const record = loadAuthRecord();

    if (envPasscode) {
      if (!timingSafeStringEqual(passcode, envPasscode)) {
        res.status(401).json({ error: 'Incorrect password. Please try again.' });
        return;
      }
    } else {
      if (!record?.passcodeHash) {
        res.status(400).json({
          error: 'Admin password is not configured yet. Please set up your admin password first.',
        });
        return;
      }
      const candidateHash = hashPasswordScrypt(passcode, record.salt);
      if (!timingSafeStringEqual(candidateHash, record.passcodeHash)) {
        res.status(401).json({ error: 'Incorrect password. Please try again.' });
        return;
      }
    }

    const now = new Date().toISOString();
    const payload: AdminSessionPayload = {
      jti: crypto.randomBytes(16).toString('hex'),
      email: AUTHORIZED_ADMIN_EMAIL,
      displayName: record?.displayName || 'GiftKart Store Admin',
      signedInAt: now,
      exp: Date.now() + TOKEN_TTL_MS,
    };
    const token = signAdminToken(payload);
    appendAdminLog('Admin Signed In', 'Admin Panel');

    res.json({
      token,
      session: buildAdminSessionResponse(payload),
    });
  });

  app.get('/api/admin/auth/me', requireAdminAuth, (req: AuthedRequest, res) => {
    const record = loadAuthRecord();
    const payload = req.adminPayload!;
    const merged: AdminSessionPayload = {
      ...payload,
      displayName: record?.displayName || payload.displayName,
    };
    res.json({ session: buildAdminSessionResponse(merged) });
  });

  app.post('/api/admin/auth/logout', requireAdminAuth, (req: AuthedRequest, res) => {
    if (req.adminPayload?.jti) {
      revokedTokenIds.add(req.adminPayload.jti);
    }
    appendAdminLog('Admin Signed Out', 'Admin Session');
    res.json({ ok: true });
  });

  app.post('/api/admin/auth/change-password', requireAdminAuth, (req: AuthedRequest, res) => {
    const body = req.body as Record<string, unknown>;
    const currentPasscode = String(body?.currentPasscode || '').trim();
    const nextPasscode = String(body?.nextPasscode || '').trim();

    if (getEnvAdminPasscode()) {
      res.status(400).json({
        error: 'Admin password is managed by server environment secret ADMIN_PASSCODE.',
      });
      return;
    }

    const record = loadAuthRecord();
    if (!record?.passcodeHash) {
      res.status(400).json({ error: 'No admin password configured.' });
      return;
    }
    if (nextPasscode.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      return;
    }
    const currentHash = hashPasswordScrypt(currentPasscode, record.salt);
    if (!timingSafeStringEqual(currentHash, record.passcodeHash)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }

    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = hashPasswordScrypt(nextPasscode, newSalt);
    saveAuthRecord({
      ...record,
      salt: newSalt,
      passcodeHash: newHash,
      updatedAt: new Date().toISOString(),
    });
    appendAdminLog('Admin Password Updated', 'Admin Security');
    res.json({ ok: true });
  });

  app.post('/api/admin/auth/profile', requireAdminAuth, (req: AuthedRequest, res) => {
    const displayName = String((req.body as Record<string, unknown>)?.displayName || '').trim();
    if (!displayName) {
      res.status(400).json({ error: 'Display name cannot be empty.' });
      return;
    }
    const record = loadAuthRecord();
    if (record) {
      saveAuthRecord({
        ...record,
        displayName,
        updatedAt: new Date().toISOString(),
      });
    }
    const updatedPayload: AdminSessionPayload = {
      ...req.adminPayload!,
      displayName,
    };
    const token = signAdminToken(updatedPayload);
    appendAdminLog('Updated Admin Profile', displayName);
    res.json({
      token,
      session: buildAdminSessionResponse(updatedPayload),
    });
  });

  app.post('/api/admin/auth/activity', requireAdminAuth, (req: AuthedRequest, res) => {
    const body = req.body as Record<string, unknown>;
    const action = String(body?.action || '').trim();
    const target = String(body?.target || '').trim();
    if (action) {
      appendAdminLog(action, target || 'Admin Panel');
    }
    res.json({ ok: true });
  });

  app.delete('/api/admin/auth/activity', requireAdminAuth, (_req, res) => {
    storeDb.adminActivityLogs = [];
    commitStoreChange(['activity']);
    res.json({ ok: true });
  });

  // =========================================================================
  // 5. PROTECTED ADMIN STORE ROUTES (Saves Live & Broadcasts Everywhere!)
  // =========================================================================
  app.get('/api/admin/store', requireAdminAuth, (_req, res) => {
    res.json({
      version: storeDb.version,
      updatedAt: storeDb.updatedAt,
      data: {
        categories: storeDb.categories,
        products: storeDb.products,
        storeSettings: storeDb.storeSettings,
        giftWrapConfig: storeDb.giftWrapConfig,
        coupons: storeDb.coupons,
        orders: storeDb.orders,
        registeredCustomers: storeDb.registeredCustomers,
        productReviews: storeDb.productReviews,
        newsletterSubscribers: storeDb.newsletterSubscribers,
        adminActivityLogs: storeDb.adminActivityLogs,
      },
    });
  });

  app.put('/api/admin/store/:collection', requireAdminAuth, (req: AuthedRequest, res) => {
    const collection = String(req.params.collection || '');
    const meta = Object.prototype.hasOwnProperty.call(COLLECTION_TOPICS, collection)
      ? COLLECTION_TOPICS[collection]
      : undefined;
    if (!meta) {
      res.status(400).json({ error: `Unsupported collection: ${collection}` });
      return;
    }

    const incoming = (req.body as { data?: unknown })?.data;
    if (meta.expectArray && !Array.isArray(incoming)) {
      res.status(400).json({ error: `Expected an array for "${collection}".` });
      return;
    }
    if (!meta.expectArray && (!incoming || typeof incoming !== 'object' || Array.isArray(incoming))) {
      res.status(400).json({ error: `Expected an object for "${collection}".` });
      return;
    }

    const sanitized = sanitizeDeepStrings(incoming);
    (storeDb as unknown as Record<string, unknown>)[collection] = sanitized;
    commitStoreChange([meta.topic]);

    res.json({
      ok: true,
      version: storeDb.version,
      updatedAt: storeDb.updatedAt,
    });
  });

  // =========================================================================
  // 6. VITE DEV MIDDLEWARE OR PRODUCTION STATIC ASSETS
  // =========================================================================
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.get('/sw.js', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.sendFile(path.join(distDir, 'sw.js'));
    });
    app.use(express.static(distDir, { index: false }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GiftKart Server] Live sync server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[GiftKart Server] Fatal startup error:', err);
  process.exit(1);
});
