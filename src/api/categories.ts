// =============================================================
// Categories API
// =============================================================

import { request } from './client';
import type { Category } from '../types';

interface CategoryFromApi {
  id: string;
  name: string;
  slug: string;
  description: string;
  position: number;
  product_count: number;
}

function mapCategory(c: CategoryFromApi): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const categories = await request<CategoryFromApi[]>('/categories');
  return categories.map(mapCategory);
}
