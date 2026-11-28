/**
 * GiftKart — Secure Telegram Bot Admin Notification Edge Function
 *
 * Handles ONLY two verified Supabase Database Webhook events:
 *   1. public.orders    (INSERT) -> New Order Notification
 *   2. public.customers (INSERT) -> New Customer Registration Notification
 *
 * Security & Reliability Guarantees:
 *   - Bot token, Chat ID, and Webhook secret live strictly in Supabase Secrets (never frontend).
 *   - Constant-time webhook secret verification (fail-closed if unset).
 *   - Re-verifies every order (including order_items) and customer directly from PostgreSQL.
 *   - Never sends notifications for existing customer logins, updates, failed orders, or admin user.
 *   - In-memory TTL + in-flight deduplication prevents duplicate notifications on retried events.
 *   - Safe timeout + bounded retry on transient Telegram API failures; never blocks DB writes.
 *   - Strict secret redaction on all logs and error outputs.
 */

declare const Deno:
  | {
      env: { get(key: string): string | undefined };
      serve(handler: (req: Request) => Response | Promise<Response>): void;
    }
  | undefined;

export interface TelegramNotifierEnv {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export interface NotifierDependencies {
  fetchImpl?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  logger?: Pick<Console, 'info' | 'warn' | 'error'>;
}

interface SupabaseWebhookPayload {
  type?: string;
  table?: string;
  schema?: string;
  record?: Record<string, unknown> | null;
  old_record?: Record<string, unknown> | null;
}

interface OrderDbRow {
  id: string;
  order_number?: string | null;
  customer_details?: {
    fullName?: string;
    full_name?: string;
    email?: string;
    phone?: string;
  } | null;
  grand_total_inr?: number | string | null;
  payment_status?: string | null;
  payment_method?: string | null;
  payment_details?: {
    status?: string;
  } | null;
  fulfillment_status?: string | null;
  created_at?: string | null;
}

interface OrderItemDbRow {
  product_name_snapshot?: string | null;
  quantity?: number | string | null;
}

interface CustomerDbRow {
  id: string;
  full_name?: string | null;
  email?: string | null;
  registered_at?: string | null;
}

const AUTHORIZED_ADMIN_EMAIL = 'admin.giftkart@gmail.com';
const DEFAULT_TELEGRAM_API_ORIGIN = 'https://api.telegram.org';
const MAX_BODY_BYTES = 128 * 1024; // 128 KB
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_TELEGRAM_ATTEMPTS = 3;
const DEDUPE_TTL_MS = 60 * 60 * 1000; // 60 minutes
const MAX_DEDUPE_ENTRIES = 5_000;

const BOT_TOKEN_PATTERN = /^\d{5,20}:[A-Za-z0-9_-]{20,100}$/;
const CHAT_ID_PATTERN = /^-?\d{4,20}$/;

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class IdempotencyStore {
  private readonly processed = new Map<string, number>();
  private readonly inFlight = new Map<string, Promise<Response>>();

  isProcessed(key: string, nowMs: number): boolean {
    const expiresAt = this.processed.get(key);
    if (expiresAt === undefined) return false;
    if (expiresAt <= nowMs) {
      this.processed.delete(key);
      return false;
    }
    return true;
  }

  markProcessed(key: string, nowMs: number): void {
    if (this.processed.size >= MAX_DEDUPE_ENTRIES) {
      for (const [existingKey, expiry] of this.processed.entries()) {
        if (expiry <= nowMs || this.processed.size >= MAX_DEDUPE_ENTRIES) {
          this.processed.delete(existingKey);
        }
        if (this.processed.size < MAX_DEDUPE_ENTRIES * 0.8) break;
      }
    }
    this.processed.set(key, nowMs + DEDUPE_TTL_MS);
  }

  getInFlight(key: string): Promise<Response> | undefined {
    return this.inFlight.get(key);
  }

  setInFlight(key: string, promise: Promise<Response>): void {
    this.inFlight.set(key, promise);
  }

  clearInFlight(key: string): void {
    this.inFlight.delete(key);
  }

  clearAll(): void {
    this.processed.clear();
    this.inFlight.clear();
  }
}

const globalIdempotencyStore = new IdempotencyStore();

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function constantTimeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bytesA = encoder.encode(a);
  const bytesB = encoder.encode(b);
  const maxLen = Math.max(bytesA.length, bytesB.length);
  let diff = bytesA.length ^ bytesB.length;
  for (let i = 0; i < maxLen; i += 1) {
    const byteA = i < bytesA.length ? bytesA[i] : 0;
    const byteB = i < bytesB.length ? bytesB[i] : 0;
    diff |= byteA ^ byteB;
  }
  return diff === 0;
}

export function redactSecrets(input: string, secrets: string[] = []): string {
  let clean = input.replace(/bot\d{5,20}:[A-Za-z0-9_-]{10,}/gi, 'bot[REDACTED]');
  for (const secret of secrets) {
    const trimmed = secret.trim();
    if (trimmed.length >= 6) {
      clean = clean.split(trimmed).join('[REDACTED]');
    }
  }
  return clean;
}

function sanitizeLine(value: unknown, fallback: string, maxLen = 200): string {
  if (typeof value !== 'string') return fallback;
  const normalized = value.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (!normalized) return fallback;
  return normalized.length > maxLen ? `${normalized.slice(0, maxLen - 1)}…` : normalized;
}

export function formatInrAmount(amount: unknown): string {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return '₹0';
  }
  const hasDecimals = Math.abs(numeric - Math.round(numeric)) > 0.001;
  return `₹${numeric.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  })}`;
}

export function formatIstDateTime(isoTimestamp?: string | null): string {
  const parsed = isoTimestamp ? new Date(isoTimestamp) : new Date();
  const safeDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  try {
    const formatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(safeDate);
    return `${formatted} IST`;
  } catch {
    return safeDate.toISOString();
  }
}

function resolvePaymentStatusLabel(order: OrderDbRow): string {
  const rawDetailStatus =
    order.payment_details && typeof order.payment_details.status === 'string'
      ? order.payment_details.status.trim()
      : '';
  const rawStatus = (rawDetailStatus || String(order.payment_status || '')).trim().toUpperCase();

  let canonical = 'Unpaid';
  if (rawStatus === 'PAID' || rawStatus === 'SUCCESS') {
    canonical = 'Paid';
  } else if (rawStatus === 'REFUNDED') {
    canonical = 'Refunded';
  } else if (rawStatus === 'FAILED') {
    canonical = 'Failed';
  } else if (rawStatus === 'PENDING' || rawStatus === 'UNPAID') {
    canonical = 'Unpaid';
  } else if (rawDetailStatus) {
    canonical = sanitizeLine(rawDetailStatus, 'Unpaid', 40);
  }

  const method = sanitizeLine(order.payment_method, '', 60);
  return method ? `${canonical} (${method})` : canonical;
}

export function formatNewOrderMessage(order: OrderDbRow, items: OrderItemDbRow[]): string {
  const orderIdLabel = sanitizeLine(order.order_number || order.id, order.id, 64);
  const customerName = sanitizeLine(
    order.customer_details?.fullName || order.customer_details?.full_name,
    'Customer',
    120
  );

  const normalizedItems = items
    .map((item) => ({
      name: sanitizeLine(item.product_name_snapshot, 'GiftKart Item', 120),
      qty: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    }))
    .filter((item) => Boolean(item.name));

  let productNameSummary = 'GiftKart Item';
  let totalQuantity = 1;

  if (normalizedItems.length === 1) {
    productNameSummary = normalizedItems[0].name;
    totalQuantity = normalizedItems[0].qty;
  } else if (normalizedItems.length > 1) {
    productNameSummary = normalizedItems
      .map((item) => `${item.name} (×${item.qty})`)
      .join(', ');
    if (productNameSummary.length > 360) {
      productNameSummary = `${productNameSummary.slice(0, 357)}...`;
    }
    totalQuantity = normalizedItems.reduce((sum, item) => sum + item.qty, 0);
  }

  const totalAmount = formatInrAmount(order.grand_total_inr);
  const paymentStatus = resolvePaymentStatusLabel(order);
  const orderDate = formatIstDateTime(order.created_at);

  return [
    '🛍️ NEW ORDER RECEIVED!',
    '',
    'GiftKart-এ একটি নতুন অর্ডার এসেছে।',
    '',
    'Order Information:',
    `- Order ID: ${orderIdLabel}`,
    `- Customer Name: ${customerName}`,
    `- Product Name: ${productNameSummary}`,
    `- Quantity: ${totalQuantity}`,
    `- Total Amount: ${totalAmount}`,
    `- Payment Status: ${paymentStatus}`,
    `- Order Date: ${orderDate}`,
    '',
    '📦 একটি নতুন অর্ডার এসেছে। অনুগ্রহ করে Admin Panel থেকে অর্ডারটি পরীক্ষা করুন।',
  ].join('\n');
}

export function formatNewCustomerMessage(customer: CustomerDbRow): string {
  const email = sanitizeLine(customer.email, '', 160).toLowerCase();
  const fallbackName = email ? email.split('@')[0] : 'GiftKart Customer';
  const customerName = sanitizeLine(customer.full_name, fallbackName || 'GiftKart Customer', 120);
  const registrationDate = formatIstDateTime(customer.registered_at);

  const lines = [
    '👤 NEW CUSTOMER REGISTERED!',
    '',
    'GiftKart-এ একজন নতুন Customer Registration করেছে।',
    '',
    'Customer Information:',
    `- Customer Name: ${customerName}`,
  ];

  if (email) {
    lines.push(`- Email: ${email}`);
  } else {
    lines.push('- Email: Not available');
  }

  lines.push(
    `- Registration Date: ${registrationDate}`,
    '',
    '🎉 GiftKart Community-তে নতুন Customer যুক্ত হয়েছে!'
  );

  return lines.join('\n');
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function querySupabaseRest<T>(
  supabaseUrl: string,
  serviceRoleKey: string,
  relativePath: string,
  fetchImpl: typeof fetch
): Promise<T[]> {
  const base = supabaseUrl.replace(/\/+$/, '');
  const endpoint = `${base}/rest/v1/${relativePath}`;
  const res = await fetchWithTimeout(
    fetchImpl,
    endpoint,
    {
      method: 'GET',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: 'application/json',
      },
    },
    REQUEST_TIMEOUT_MS
  );

  if (!res.ok) {
    throw new Error(`Supabase REST lookup failed with status ${res.status}`);
  }
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as T[]) : [];
}

async function sendTelegramMessage(params: {
  botToken: string;
  chatId: string;
  text: string;
  apiBaseOrigin: string;
  fetchImpl: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  logger: Pick<Console, 'info' | 'warn' | 'error'>;
  eventKey: string;
}): Promise<{ ok: boolean; statusCode: number; attempts: number; errorSummary?: string }> {
  const { botToken, chatId, text, apiBaseOrigin, fetchImpl, sleep, logger, eventKey } = params;
  const endpoint = `${apiBaseOrigin.replace(/\/+$/, '')}/bot${botToken}/sendMessage`;

  let lastStatus = 0;
  let lastError = 'Unknown Telegram error';

  for (let attempt = 1; attempt <= MAX_TELEGRAM_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        fetchImpl,
        endpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            disable_web_page_preview: true,
          }),
        },
        REQUEST_TIMEOUT_MS
      );

      lastStatus = response.status;
      let parsedBody: { ok?: boolean; description?: string; parameters?: { retry_after?: number } } | null =
        null;
      try {
        parsedBody = (await response.json()) as {
          ok?: boolean;
          description?: string;
          parameters?: { retry_after?: number };
        };
      } catch {
        parsedBody = null;
      }

      if (response.ok && parsedBody?.ok !== false) {
        return { ok: true, statusCode: response.status, attempts: attempt };
      }

      lastError = redactSecrets(
        parsedBody?.description || `Telegram HTTP ${response.status}`,
        [botToken]
      );

      const isTransient = response.status === 429 || response.status >= 500;
      if (!isTransient || attempt === MAX_TELEGRAM_ATTEMPTS) {
        logger.error(
          `[GiftKart Telegram] Delivery failed (${eventKey}) attempt=${attempt}/${MAX_TELEGRAM_ATTEMPTS} status=${response.status}: ${lastError}`
        );
        return {
          ok: false,
          statusCode: response.status,
          attempts: attempt,
          errorSummary: lastError,
        };
      }

      const retryAfterSec = Number(parsedBody?.parameters?.retry_after || 0);
      const backoffMs =
        response.status === 429 && retryAfterSec > 0
          ? Math.min(retryAfterSec * 1000, 5_000)
          : attempt === 1
            ? 500
            : 1_500;
      logger.warn(
        `[GiftKart Telegram] Transient error (${eventKey}) status=${response.status}, retrying in ${backoffMs}ms`
      );
      await sleep(backoffMs);
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      lastError = redactSecrets(rawMessage, [botToken]);
      if (attempt === MAX_TELEGRAM_ATTEMPTS) {
        logger.error(
          `[GiftKart Telegram] Network/timeout failure (${eventKey}) after ${attempt} attempts: ${lastError}`
        );
        return {
          ok: false,
          statusCode: 0,
          attempts: attempt,
          errorSummary: lastError,
        };
      }
      const backoffMs = attempt === 1 ? 500 : 1_500;
      logger.warn(
        `[GiftKart Telegram] Network failure (${eventKey}) attempt=${attempt}, retrying in ${backoffMs}ms: ${lastError}`
      );
      await sleep(backoffMs);
    }
  }

  return { ok: false, statusCode: lastStatus, attempts: MAX_TELEGRAM_ATTEMPTS, errorSummary: lastError };
}

export async function handleTelegramWebhookRequest(
  req: Request,
  env: TelegramNotifierEnv,
  deps: NotifierDependencies = {},
  idempotencyStore: IdempotencyStore = globalIdempotencyStore
): Promise<Response> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? (() => Date.now());
  const sleep = deps.sleep ?? defaultSleep;
  const logger = deps.logger ?? console;

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405);
  }

  // 1. Fail-closed server secret validation
  const webhookSecret = (env.TELEGRAM_WEBHOOK_SECRET || '').trim();
  const botToken = (env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = (env.TELEGRAM_CHAT_ID || '').trim();
  const supabaseUrl = (env.SUPABASE_URL || '').trim();
  const serviceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!webhookSecret) {
    logger.error('[GiftKart Telegram] TELEGRAM_WEBHOOK_SECRET is not configured.');
    return jsonResponse({ ok: false, error: 'webhook_secret_not_configured' }, 500);
  }

  const providedSecret =
    (req.headers.get('x-giftkart-webhook-secret') || req.headers.get('x-webhook-secret') || '').trim();

  if (!providedSecret || !constantTimeEqual(providedSecret, webhookSecret)) {
    logger.warn('[GiftKart Telegram] Rejected unauthorized webhook request.');
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  }

  if (!botToken || !BOT_TOKEN_PATTERN.test(botToken) || !chatId || !CHAT_ID_PATTERN.test(chatId)) {
    logger.error('[GiftKart Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing or invalid.');
    return jsonResponse({ ok: false, error: 'telegram_not_configured' }, 500);
  }

  if (!supabaseUrl || !serviceRoleKey) {
    logger.error('[GiftKart Telegram] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.');
    return jsonResponse({ ok: false, error: 'supabase_env_not_configured' }, 500);
  }

  // 2. Parse & size-guard webhook JSON payload
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_body' }, 400);
  }
  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return jsonResponse({ ok: false, error: 'payload_too_large' }, 413);
  }

  let payload: SupabaseWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as SupabaseWebhookPayload;
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  const eventType = String(payload?.type || '').trim().toUpperCase();
  const schema = String(payload?.schema || 'public').trim().toLowerCase();
  const table = String(payload?.table || '').trim().toLowerCase();
  const record = payload?.record && typeof payload.record === 'object' ? payload.record : null;

  // 3. Strictly filter ONLY the two permitted INSERT events
  if (schema !== 'public' || eventType !== 'INSERT' || !record) {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: 'ignored_event_type',
    });
  }

  if (table !== 'orders' && table !== 'customers') {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: 'ignored_table',
    });
  }

  const recordId = typeof record.id === 'string' ? record.id.trim() : '';
  if (!recordId || recordId.length > 128) {
    return jsonResponse({ ok: false, error: 'missing_record_id' }, 400);
  }

  // Skip primary admin account on customers INSERT immediately
  if (table === 'customers') {
    const rawEmail = typeof record.email === 'string' ? record.email.trim().toLowerCase() : '';
    if (rawEmail === AUTHORIZED_ADMIN_EMAIL) {
      return jsonResponse({
        ok: true,
        skipped: true,
        reason: 'admin_account_excluded',
      });
    }
  }

  const eventKey = `${table === 'orders' ? 'order' : 'customer'}:${recordId}`;
  const currentNow = now();

  // 4. Duplicate & concurrent delivery prevention
  if (idempotencyStore.isProcessed(eventKey, currentNow)) {
    logger.info(`[GiftKart Telegram] Duplicate event skipped (${eventKey}).`);
    return jsonResponse({
      ok: true,
      duplicate: true,
      eventKey,
    });
  }

  const existingInFlight = idempotencyStore.getInFlight(eventKey);
  if (existingInFlight) {
    logger.info(`[GiftKart Telegram] Concurrent duplicate event deduplicated (${eventKey}).`);
    await existingInFlight;
    return jsonResponse({
      ok: true,
      duplicate: true,
      eventKey,
    });
  }

  const workPromise = (async (): Promise<Response> => {
    try {
      let telegramMessage = '';

      if (table === 'orders') {
        // Re-verify order directly from PostgreSQL (never trust unverified webhook fields)
        const orderRows = await querySupabaseRest<OrderDbRow>(
          supabaseUrl,
          serviceRoleKey,
          `orders?id=eq.${encodeURIComponent(recordId)}&select=id,order_number,customer_details,grand_total_inr,payment_status,payment_method,payment_details,fulfillment_status,created_at&limit=1`,
          fetchImpl
        );
        const verifiedOrder = orderRows[0];
        if (!verifiedOrder) {
          logger.warn(`[GiftKart Telegram] Order not found in DB, skipping (${eventKey}).`);
          return jsonResponse({
            ok: true,
            skipped: true,
            reason: 'order_not_found_in_db',
          });
        }

        let itemRows = await querySupabaseRest<OrderItemDbRow>(
          supabaseUrl,
          serviceRoleKey,
          `order_items?order_id=eq.${encodeURIComponent(recordId)}&select=product_name_snapshot,quantity&order=created_at.asc`,
          fetchImpl
        );
        if (itemRows.length === 0) {
          // One brief retry in case of read-replica lag
          await sleep(250);
          itemRows = await querySupabaseRest<OrderItemDbRow>(
            supabaseUrl,
            serviceRoleKey,
            `order_items?order_id=eq.${encodeURIComponent(recordId)}&select=product_name_snapshot,quantity&order=created_at.asc`,
            fetchImpl
          );
        }

        telegramMessage = formatNewOrderMessage(verifiedOrder, itemRows);
      } else {
        // Re-verify newly registered customer directly from PostgreSQL
        const customerRows = await querySupabaseRest<CustomerDbRow>(
          supabaseUrl,
          serviceRoleKey,
          `customers?id=eq.${encodeURIComponent(recordId)}&select=id,full_name,email,registered_at&limit=1`,
          fetchImpl
        );
        const verifiedCustomer = customerRows[0];
        if (!verifiedCustomer) {
          logger.warn(`[GiftKart Telegram] Customer not found in DB, skipping (${eventKey}).`);
          return jsonResponse({
            ok: true,
            skipped: true,
            reason: 'customer_not_found_in_db',
          });
        }

        if ((verifiedCustomer.email || '').trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL) {
          return jsonResponse({
            ok: true,
            skipped: true,
            reason: 'admin_account_excluded',
          });
        }

        telegramMessage = formatNewCustomerMessage(verifiedCustomer);
      }

      const delivery = await sendTelegramMessage({
        botToken,
        chatId,
        text: telegramMessage,
        apiBaseOrigin: DEFAULT_TELEGRAM_API_ORIGIN,
        fetchImpl,
        sleep,
        logger,
        eventKey,
      });

      if (!delivery.ok) {
        return jsonResponse(
          {
            ok: false,
            error: 'telegram_delivery_failed',
            eventKey,
            attempts: delivery.attempts,
          },
          502
        );
      }

      idempotencyStore.markProcessed(eventKey, now());
      logger.info(`[GiftKart Telegram] Notification sent successfully (${eventKey}).`);
      return jsonResponse({
        ok: true,
        sent: true,
        eventKey,
        attempts: delivery.attempts,
      });
    } catch (err) {
      const safeError = redactSecrets(err instanceof Error ? err.message : String(err), [
        botToken,
        serviceRoleKey,
        webhookSecret,
      ]);
      logger.error(`[GiftKart Telegram] Unexpected error (${eventKey}): ${safeError}`);
      return jsonResponse(
        {
          ok: false,
          error: 'notification_processing_failed',
          eventKey,
        },
        500
      );
    }
  })();

  idempotencyStore.setInFlight(eventKey, workPromise);
  try {
    return await workPromise;
  } finally {
    idempotencyStore.clearInFlight(eventKey);
  }
}

// Supabase Edge Function runtime entrypoint (Deno)
if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve((req: Request) =>
    handleTelegramWebhookRequest(req, {
      TELEGRAM_BOT_TOKEN: Deno.env.get('TELEGRAM_BOT_TOKEN'),
      TELEGRAM_CHAT_ID: Deno.env.get('TELEGRAM_CHAT_ID'),
      TELEGRAM_WEBHOOK_SECRET: Deno.env.get('TELEGRAM_WEBHOOK_SECRET'),
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    })
  );
}
