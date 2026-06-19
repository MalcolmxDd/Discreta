// =============================================================
// Reviews API
// =============================================================

import { request } from './client';
import type { Review } from '../types';

interface ReviewFromApi {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewsResponse {
  reviews: ReviewFromApi[];
  average: number;
  total: number;
  distribution: Record<number, number>;
}

function mapReview(r: ReviewFromApi): Review {
  return {
    id: r.id,
    productId: r.productId,
    userName: r.userName,
    rating: r.rating,
    comment: r.comment,
    date: r.date,
  };
}

export async function submitReview(input: {
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  userId?: string | null;
}): Promise<Review> {
  const result = await request<ReviewFromApi>('/reviews', {
    method: 'POST',
    body: input,
  });
  return mapReview(result);
}

export async function fetchReviewsByProduct(productId: string): Promise<{
  reviews: Review[];
  average: number;
  total: number;
  distribution: Record<number, number>;
}> {
  const data = await request<ReviewsResponse>(`/reviews?productId=${encodeURIComponent(productId)}`);
  return {
    reviews: data.reviews.map(mapReview),
    average: data.average,
    total: data.total,
    distribution: data.distribution,
  };
}
