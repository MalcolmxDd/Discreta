import { request } from './client';

interface MercadoPagoPreferenceResponse {
  order_id: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  items_count: number;
  init_point: string;
  preference_id: string;
}

interface ConfirmPaymentPayload {
  order_id?: string;
  payment_id?: string;
}

interface ConfirmPaymentResponse {
  processed: boolean;
  message: string;
  order_id?: string;
  status?: string;
}

interface CreatePreferencePayload {
  shipping_name: string;
  shipping_email: string;
  shipping_phone?: string;
  shipping_address: string;
  shipping_city: string;
  shipping_zip: string;
  shipping_region: string;
  items: { product_id: string; quantity: number }[];
  coupon?: string;
  user_id?: string | null;
}

export async function createPaymentPreference(
  data: CreatePreferencePayload
): Promise<MercadoPagoPreferenceResponse> {
  return request<MercadoPagoPreferenceResponse>('/mercado-pago/create-preference', {
    method: 'POST',
    body: data,
  });
}

export async function confirmPayment(
  data: ConfirmPaymentPayload
): Promise<ConfirmPaymentResponse> {
  return request<ConfirmPaymentResponse>('/mercado-pago/confirm-payment', {
    method: 'POST',
    body: data,
  });
}
