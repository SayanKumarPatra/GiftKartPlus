export type StoreEventTopic =
  | 'catalog'
  | 'giftWrap'
  | 'orders'
  | 'settings'
  | 'coupons'
  | 'auth'
  | 'community'
  | 'all';

type Listener = (topic: StoreEventTopic) => void;

const listeners = new Set<Listener>();

export const storeEvents = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  emit(topic: StoreEventTopic): void {
    listeners.forEach((listener) => {
      try {
        listener(topic);
      } catch (err) {
        console.error('[GiftKart StoreEvents] Listener error:', err);
      }
    });
  },
};
