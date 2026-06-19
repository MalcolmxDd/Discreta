// =============================================================
// Orders API
// =============================================================

import { request } from './client';

interface CreateOrderInput {
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

interface CreateOrderResponse {
  order_id: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  items_count: number;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResponse> {
  return request<CreateOrderResponse>('/orders', {
    method: 'POST',
    body: input,
  });
}
