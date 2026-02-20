import { apiClient } from './client';

export interface CreateOrderData {
  type: 'Booking' | 'GroupClass' | 'Course';
  resourceId: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  paymentUrl?: string;
}

// --- Student Payment History ---
export interface StudentPaymentDto {
  orderId: string;
  type: string;              // "Booking" | "Course" | "GroupClass"
  amount: number;
  currency: string;
  status: string;            // "Paid" | "Refunded" | "PartiallyRefunded" | "Failed"
  createdAt: string;
  paidAt: string | null;
  resourceTitle: string | null;
  mentorName: string | null;
  resourceId: string;
  refundedAmount: number | null;
  refundPercentage: number;              // 0 = no refund, 0.5 = 50%, 1 = 100%
  refundIneligibleReason: string | null; // null = eligible, string = reason why not
}

export interface PaginatedPayments {
  items: StudentPaymentDto[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// --- Refund Requests ---
export interface RefundRequestDto {
  id: string;
  orderId: string;
  status: string;
  requestedAmount: number;
  reason: string;
  createdAt: string;
}

export interface StudentRefundRequestDto {
  id: string;
  orderId: string;
  orderType: string;
  requestedAmount: number;
  approvedAmount: number | null;
  status: string;
  reason: string;
  createdAt: string;
  processedAt: string | null;
}

export const paymentsApi = {
  createOrder: async (data: {
    type: string;
    resourceId: string;
    buyerName?: string;
    buyerSurname?: string;
    buyerPhone?: string;
  }): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    checkoutFormContent?: string;
    paymentPageUrl?: string;
    token?: string;
  }> => {
    return apiClient.post('/payments/orders', data);
  },

  getMyOrders: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }): Promise<PaginatedPayments> => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return apiClient.get(`/payments/my-orders${qs ? `?${qs}` : ''}`);
  },

  // Refund requests
  requestRefund: async (data: {
    orderId: string;
    reason: string;
  }): Promise<RefundRequestDto> => {
    return apiClient.post('/refunds/request', data);
  },

  getMyRefundRequests: async (): Promise<StudentRefundRequestDto[]> => {
    return apiClient.get('/refunds/my-requests');
  },
};