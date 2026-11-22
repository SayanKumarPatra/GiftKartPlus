/**
 * Future Transactional Email Notification Contract (UNCONNECTED).
 */
export interface IEmailNotificationService {
  readonly connected: false;
  readonly statusLabel: 'Integration Ready — Not Connected';
  sendDemoOrderReceipt(payload: {
    toEmail: string;
    orderNumber: string;
    grandTotalInr: number;
  }): Promise<{ sent: false; reason: string }>;
}

export const emailPlaceholderAdapter: IEmailNotificationService = {
  connected: false,
  statusLabel: 'Integration Ready — Not Connected',
  async sendDemoOrderReceipt() {
    return {
      sent: false,
      reason: 'Email notification provider is Integration Ready — Not Connected.',
    };
  },
};
