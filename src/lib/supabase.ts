import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  ''
).trim();

export const SUPABASE_MEDIA_BUCKET = 'giftkart-media';

let cachedClient: SupabaseClient | null = null;
let schemaMissingLogged = false;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getSupabaseProjectUrl(): string {
  return supabaseUrl;
}

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) are not configured.'
    );
  }
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'giftkart-supabase-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }
  return cachedClient;
}

/**
 * Detects PostgREST / Postgres errors indicating the SQL migration has not yet been executed
 * in the target Supabase project's SQL Editor.
 */
export function isSupabaseSchemaMissingError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = String((err as { code?: unknown }).code ?? '');
  const message = String((err as { message?: unknown }).message ?? '');
  return (
    code === 'PGRST205' ||
    code === 'PGRST202' ||
    code === '42P01' ||
    code === '42883' ||
    message.includes('Could not find the table') ||
    message.includes('Could not find the function') ||
    message.includes('schema cache')
  );
}

export function reportSchemaNotInitializedOnce(context: string): void {
  if (schemaMissingLogged) return;
  schemaMissingLogged = true;
  console.warn(
    `[GiftKart Supabase] Schema not yet initialized (${context}). Run supabase/migrations/001_giftkart_complete_schema.sql in your Supabase SQL Editor.`
  );
}

/**
 * Uploads an image File or Blob to Supabase Storage (giftkart-media bucket)
 * and returns its public HTTPS URL.
 */
export async function uploadImageToSupabaseStorage(
  folder: 'products' | 'categories' | 'banners' | 'branding' | 'avatars' | 'reviews',
  file: File,
  ownerScope?: string
): Promise<string> {
  const client = getSupabaseClient();
  const safeExt = (file.name.split('.').pop() || 'webp')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 6);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt || 'webp'}`;
  const path = ownerScope ? `${folder}/${ownerScope}/${uniqueName}` : `${folder}/${uniqueName}`;

  const { error } = await client.storage.from(SUPABASE_MEDIA_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: true,
    contentType: file.type || 'image/webp',
  });
  if (error) {
    throw new Error(error.message || 'Image upload to Supabase Storage failed.');
  }
  const { data } = client.storage.from(SUPABASE_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
