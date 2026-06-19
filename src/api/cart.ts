import { request } from './client';
import type { Product } from '../types';

interface CartItemFromApi extends Product {
  quantity: number;
}

export async function fetchCartItems(): Promise<CartItemFromApi[]> {
  return request<CartItemFromApi[]>('/cart');
}

export async function syncCart(items: { product_id: string; quantity: number }[]): Promise<void> {
  await request('/cart/sync', {
    method: 'POST',
    body: { items },
  });
}
