export type PaymentRequest = { orderId: string; amount: number; currency: 'TND'; customerPhone: string }
export type PaymentResult = { provider: string; status: 'pending' | 'paid' | 'failed'; redirectUrl?: string }

export interface PaymentProvider {
  createPayment(request: PaymentRequest): Promise<PaymentResult>
}

export class CashOnDeliveryProvider implements PaymentProvider {
  async createPayment(_request: PaymentRequest): Promise<PaymentResult> {
    void _request
    return { provider: 'cash_on_delivery', status: 'pending' }
  }
}
