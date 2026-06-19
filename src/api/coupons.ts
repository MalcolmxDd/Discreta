import { request } from "./client";

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_amount: number | null;
  max_uses: number | null;
  used_count: number;
  is_active: number;
  expires_at: string | null;
  created_at: string;
}

interface CouponValidation {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  discount: number;
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidation> {
  return request<CouponValidation>("/coupons/validate", {
    method: "POST",
    body: { code, subtotal },
  });
}

export async function fetchCoupons(): Promise<Coupon[]> {
  return request<Coupon[]>("/admin/coupons");
}

export async function createCoupon(data: Partial<Coupon>): Promise<{ id: string; code: string }> {
  return request<{ id: string; code: string }>("/admin/coupons", {
    method: "POST",
    body: data,
  });
}

export async function updateCoupon(data: Partial<Coupon> & { id: string }): Promise<void> {
  await request("/admin/coupons/update", {
    method: "PUT",
    body: data,
  });
}

export async function deleteCoupon(id: string): Promise<void> {
  await request("/admin/coupons/delete", {
    method: "DELETE",
    body: { id },
  });
}
