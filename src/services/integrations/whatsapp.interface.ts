/**
 * Future WhatsApp Business API Notification Contract (UNCONNECTED).
 */
export interface IWhatsAppNotificationService {
  readonly connected: false;
  readonly statusLabel: 'Integration Ready — Not Connected';
  sendOrderUpdateTemplate(payload: {
    phone: string;
    orderNumber: string;
    status: string;
  }): Promise<{ sent: false; reason: string }>;
}

export const whatsappPlaceholderAdapter: IWhatsAppNotificationService = {
  connected: false,
  statusLabel: 'Integration Ready — Not Connected',
  async sendOrderUpdateTemplate() {
    return {
      sent: false,
      reason: 'WhatsApp Business API is Integration Ready — Not Connected.',
    };
  },
};
