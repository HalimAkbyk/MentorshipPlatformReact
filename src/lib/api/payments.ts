import { apiClient } from './client';

export interface CreateOrderData {
  type: 'Booking' | 'ClassSeat';
  resourceId: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  paymentUrl?: string;
}

export const paymentsApi = {
  createOrder: async (data: {
    type: string;
    resourceId: string;
    buyerName?: string;      // ✅ YENİ
    buyerSurname?: string;   // ✅ YENİ
    buyerPhone?: string;     // ✅ YENİ
  }): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    checkoutFormContent?: string;  // ✅ YENİ - HTML content
    paymentPageUrl?: string;       // ✅ YENİ - External redirect URL
    token?: string;                // ✅ YENİ - Checkout form token
  }> => {
    return apiClient.post('/payments/orders', data);
  },
};