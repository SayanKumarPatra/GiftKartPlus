/**
 * Future Ecommerce Analytics Service Contract (UNCONNECTED).
 */
export interface IAnalyticsService {
  readonly connected: false;
  readonly statusLabel: 'Integration Ready — Not Connected';
  trackEvent(eventName: string, properties?: Record<string, string | number | boolean>): void;
}

export const analyticsPlaceholderAdapter: IAnalyticsService = {
  connected: false,
  statusLabel: 'Integration Ready — Not Connected',
  trackEvent() {
    // No-op until analytics provider is connected in a future phase.
  },
};
