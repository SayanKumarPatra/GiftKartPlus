import type {
  CashfreeSessionRequest,
  CashfreeSessionResponse,
  IPaymentGatewayService,
  PaymentGatewayDescriptor,
} from '../interfaces';

/**
 * Future Cashfree Payment Gateway Adapter Contract (UNCONNECTED).
 *
 * Strictly does NOT simulate or fake payments.
 * Initial GiftKart checkout supports Demo Order Placement ONLY.
 */
export class CashfreeNotConnectedError extends Error {
  constructor() {
    super(
      'Cashfree Payment Gateway is Integration Ready — Not Connected. Online payment collection is disabled in this demo phase.'
    );
    this.name = 'CashfreeNotConnectedError';
  }
}

export class CashfreePlaceholderAdapter implements IPaymentGatewayService {
  getDescriptor(): PaymentGatewayDescriptor {
    return {
      provider: 'CASHFREE',
      connected: false,
      statusCode: 'INTEGRATION_READY_NOT_CONNECTED',
      statusLabel: 'Integration Ready — Not Connected',
      description:
        'Prepared TypeScript gateway interface for future Cashfree Checkout & Webhook verification. No real payment is collected in demo mode.',
    };
  }

  async createPaymentSession(
    _request: CashfreeSessionRequest
  ): Promise<CashfreeSessionResponse> {
    throw new CashfreeNotConnectedError();
  }

  async verifyPaymentStatus(
    _orderNumber: string
  ): Promise<{ verified: false; reason: string }> {
    return {
      verified: false,
      reason: 'Cashfree Payment Gateway is Integration Ready — Not Connected.',
    };
  }
}
