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
 * Prepared for Phase 02 real backend payment integration.
 */
export class CashfreeNotConnectedError extends Error {
  constructor() {
    super(
      'Cashfree Payment Gateway is integration-ready and will be enabled after backend setup.'
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
        'Prepared TypeScript gateway interface for future Cashfree Checkout & Webhook verification.',
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
