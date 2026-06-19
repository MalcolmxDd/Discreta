// =============================================================
// Products API
// =============================================================

import { request } from './client';
import type { Product } from '../types';

interface ProductFilters {
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  sort?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}

interface ProductFromApi {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  price: number;
  original_price: number | null;
  image: string;
  images: string[];
  gradient: string;
  category: string;
  category_name: string;
  category_slug: string;
  tags: string[];
  rating: number;
  in_stock: boolean;
  stock_count: number;
  features: string[];
  is_featured: boolean;
}

function mapProduct(p: ProductFromApi): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    longDescription: p.long_description,
    price: p.price,
    originalPrice: p.original_price ?? undefined,
    images: p.images?.length ? p.images : (p.image ? [p.image] : []),
    gradient: p.gradient,
    category: p.category,
    tags: p.tags,
    rating: p.rating,
    inStock: p.in_stock,
    stockCount: p.stock_count,
    features: p.features,
    isFeatured: p.is_featured,
  };
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const params = new URLSearchParams();

  if (filters.category && filters.category !== 'todas') {
    params.set('category', filters.category);
  }
  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.min_price !== undefined) {
    params.set('min_price', String(filters.min_price));
  }
  if (filters.max_price !== undefined) {
    params.set('max_price', String(filters.max_price));
  }
  if (filters.sort && filters.sort !== 'default') {
    params.set('sort', filters.sort);
  }
  if (filters.featured) {
    params.set('featured', 'true');
  }
  if (filters.limit !== undefined) {
    params.set('limit', String(filters.limit));
  }
  if (filters.offset !== undefined) {
    params.set('offset', String(filters.offset));
  }

  const query = params.toString();
  const response = await request<{ items?: ProductFromApi[]; total?: number } | ProductFromApi[]>(`/products${query ? `?${query}` : ''}`);

  // Handle both paginated { items, total } and flat array response
  if (Array.isArray(response)) {
    return response.map(mapProduct);
  }
  return (response.items || []).map(mapProduct);
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const product = await request<ProductFromApi>(`/products/${slug}`);
  return mapProduct(product);
}
