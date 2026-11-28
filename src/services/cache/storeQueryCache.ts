import { storeEvents, type StoreEventTopic } from '../../storage/storeEvents';

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  topics: StoreEventTopic[];
  persist: boolean;
}

interface FetchOptions {
  staleTimeMs?: number;
  topics: StoreEventTopic[];
  persist?: boolean;
  force?: boolean;
}

const PERSIST_PREFIX = 'giftkart:swr:v1:';
const PERSIST_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes max for persisted storefront snapshot
const PERSIST_MAX_BYTES = 1_800_000; // Safely caches full catalog/categories while staying well under 5MB localStorage limit

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inflightRequests = new Map<string, Promise<unknown>>();
const keyListeners = new Map<string, Set<(data: unknown) => void>>();

function readPersistedSnapshot<T>(key: string): { data: T; fetchedAt: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${PERSIST_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data?: T; fetchedAt?: number };
    if (
      !parsed ||
      typeof parsed.fetchedAt !== 'number' ||
      parsed.data === undefined
    ) {
      return null;
    }
    if (Date.now() - parsed.fetchedAt > PERSIST_MAX_AGE_MS) {
      window.localStorage.removeItem(`${PERSIST_PREFIX}${key}`);
      return null;
    }
    return { data: parsed.data, fetchedAt: parsed.fetchedAt };
  } catch {
    return null;
  }
}

function writePersistedSnapshot<T>(key: string, data: T, fetchedAt: number): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify({ data, fetchedAt });
    if (serialized.length > PERSIST_MAX_BYTES) {
      // Skip persisting oversized payloads (e.g. legacy base64 data URLs)
      return;
    }
    window.localStorage.setItem(`${PERSIST_PREFIX}${key}`, serialized);
  } catch {
    // Ignore storage quota / private mode failures silently
  }
}

function removePersistedSnapshot(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(`${PERSIST_PREFIX}${key}`);
  } catch {
    // Ignore
  }
}

function notifyKeyListeners(key: string, data: unknown): void {
  const subs = keyListeners.get(key);
  if (!subs || subs.size === 0) return;
  subs.forEach((fn) => {
    try {
      fn(data);
    } catch {
      // Ignore individual listener errors
    }
  });
}

// Automatically mark matching cached entries stale whenever storeEvents fires
// (Admin saves, checkout stock updates, Realtime DB events, Auth sign-in/out).
storeEvents.subscribe((topic) => {
  memoryCache.forEach((entry, key) => {
    if (topic === 'all' || entry.topics.includes(topic)) {
      entry.fetchedAt = 0;
      if (entry.persist) {
        removePersistedSnapshot(key);
      }
    }
  });
});

export const storeQueryCache = {
  /**
   * Synchronously reads warm data from in-memory cache or persisted storefront snapshot.
   * Returns null if nothing is cached yet.
   */
  peek<T>(key: string, persist = false): { data: T; fetchedAt: number } | null {
    const mem = memoryCache.get(key);
    if (mem) {
      return { data: mem.data as T, fetchedAt: mem.fetchedAt };
    }
    if (persist) {
      const snap = readPersistedSnapshot<T>(key);
      if (snap) {
        // Hydrate into memory cache as stale (fetchedAt = 0) so UI renders
        // instantaneously while a single background revalidation fetches fresh live data.
        memoryCache.set(key, {
          data: snap.data,
          fetchedAt: 0,
          topics: [],
          persist: true,
        });
        return { data: snap.data, fetchedAt: 0 };
      }
    }
    return null;
  },

  /**
   * Subscribe to updates for a specific cache key so all mounted hooks using
   * the same key receive the freshly fetched result simultaneously.
   */
  subscribe<T>(key: string, listener: (data: T) => void): () => void {
    let subs = keyListeners.get(key);
    if (!subs) {
      subs = new Set();
      keyListeners.set(key, subs);
    }
    const wrapped = listener as (data: unknown) => void;
    subs.add(wrapped);
    return () => {
      const current = keyListeners.get(key);
      if (!current) return;
      current.delete(wrapped);
      if (current.size === 0) {
        keyListeners.delete(key);
      }
    };
  },

  /**
   * Deduplicated SWR fetch:
   * - If fresh data exists in memory (within staleTimeMs) and !force, returns immediately.
   * - If an identical request is already in flight, attaches to the exact same Promise
   *   (eliminates duplicate simultaneous Supabase HTTP calls across components).
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: FetchOptions
  ): Promise<T> {
    const staleTimeMs = options.staleTimeMs ?? 30_000;
    const persist = Boolean(options.persist);
    const force = Boolean(options.force);

    const existing = memoryCache.get(key);
    if (
      !force &&
      existing &&
      existing.fetchedAt > 0 &&
      Date.now() - existing.fetchedAt < staleTimeMs
    ) {
      // Ensure topics metadata is up to date (e.g., if seeded from persisted snapshot)
      if (existing.topics.length === 0) {
        existing.topics = options.topics;
      }
      return existing.data as T;
    }

    const pending = inflightRequests.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const requestPromise = (async () => {
      try {
        const result = await fetcher();
        const now = Date.now();
        memoryCache.set(key, {
          data: result,
          fetchedAt: now,
          topics: options.topics,
          persist,
        });
        if (persist) {
          writePersistedSnapshot(key, result, now);
        }
        notifyKeyListeners(key, result);
        return result;
      } finally {
        inflightRequests.delete(key);
      }
    })();

    inflightRequests.set(key, requestPromise);
    return requestPromise;
  },

  invalidateKey(key: string): void {
    const entry = memoryCache.get(key);
    if (entry) {
      entry.fetchedAt = 0;
    }
    removePersistedSnapshot(key);
  },
};
