import { request } from './client';
import type { Product } from '../types';

export async function fetchWishlistProducts(): Promise<Product[]> {
  return request<Product[]>('/wishlist');
}

export async function addWishlistItem(productId: string): Promise<void> {
  await request('/wishlist', {
    method: 'POST',
    body: { product_id: productId },
  });
}

export async function removeWishlistItem(productId: string): Promise<void> {
  await request('/wishlist', {
    method: 'DELETE',
    body: { product_id: productId },
  });
}
