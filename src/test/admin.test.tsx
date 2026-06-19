import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AdminProvider, useAdmin } from '../context/AdminContext'
import type { ReactNode } from 'react'

const mockProducts = [
  { id: 'vib-001', name: 'Luna', slug: 'luna', description: 'Test', long_description: 'Test',
    price: 1290, original_price: null, image: '', images: [], gradient: '', category: 'vibradores',
    category_name: 'Vibradores', category_slug: 'vibradores',
    tags: ['bullet'], rating: 4.5, in_stock: true, stock_count: 10,
    features: ['Feature'], is_featured: true },
  { id: 'dil-001', name: 'Eros', slug: 'eros', description: 'Test', long_description: 'Test',
    price: 2250, original_price: null, image: '', images: [], gradient: '', category: 'dildos',
    category_name: 'Dildos', category_slug: 'dildos',
    tags: ['classic'], rating: 4.3, in_stock: false, stock_count: 0,
    features: ['Feature'], is_featured: false },
];

const mockCategories = [
  { id: 'vibradores', name: 'Vibradores', slug: 'vibradores', description: 'Test', position: 1, product_count: 1 },
  { id: 'dildos', name: 'Dildos', slug: 'dildos', description: 'Test', position: 2, product_count: 1 },
];

const mockDashboard = {
  totalProducts: 2, totalCategories: 2, lowStock: 1, outOfStock: 0, avgPrice: 1770, maintenance: false,
  featured: 1, withDiscount: 0, totalOrders: 0, totalUsers: 1,
};

function wrapper({ children }: { children: ReactNode }) {
  return <AdminProvider>{children}</AdminProvider>;
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn((url: string) => {
    if (url.includes('/api/admin/dashboard')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: mockDashboard }) });
    }
    if (url.includes('/api/products')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: mockProducts }) });
    }
    if (url.includes('/api/categories')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: mockCategories }) });
    }
    if (url.includes('/api/admin/products')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { id: 'test-001' } }) });
    }
    if (url.includes('/api/admin/categories')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { id: 'test-cat' } }) });
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Not found' }) });
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AdminContext', () => {
  describe('Auth', () => {
    it('starts logged out', () => {
      const { result } = renderHook(() => useAdmin(), { wrapper });
      expect(result.current.isAdmin).toBe(false);
    });

    it('logs in when JWT token exists and dashboard responds', async () => {
      localStorage.setItem('discretastore-auth-token', 'mock-token');
      const { result } = renderHook(() => useAdmin(), { wrapper });
      await act(async () => { await result.current.login(); });
      await waitFor(() => { expect(result.current.isAdmin).toBe(true); });
    });

    it('rejects login if dashboard fails', async () => {
      localStorage.setItem('discretastore-auth-token', 'bad-token');
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Unauthorized' }) })));
      const { result } = renderHook(() => useAdmin(), { wrapper });
      const ok = await act(async () => result.current.login());
      expect(ok).toBe(false);
      expect(result.current.isAdmin).toBe(false);
    });

    it('logs out', async () => {
      localStorage.setItem('discretastore-auth-token', 'mock-token');
      const { result } = renderHook(() => useAdmin(), { wrapper });
      await act(async () => { await result.current.login(); });
      await waitFor(() => { expect(result.current.isAdmin).toBe(true); });
      act(() => { result.current.logout(); });
      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('Products CRUD', () => {
    it('loads products after login', async () => {
      localStorage.setItem('discretastore-auth-token', 'mock-token');
      const { result } = renderHook(() => useAdmin(), { wrapper });
      await act(async () => { await result.current.login(); });
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      expect(result.current.products.length).toBe(2);
    });

    it('adds a product', async () => {
      localStorage.setItem('discretastore-auth-token', 'mock-token');
      const { result } = renderHook(() => useAdmin(), { wrapper });
      await act(async () => { await result.current.login(); });
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      await act(async () => {
        await result.current.addProduct({
          id: '', name: 'Test', slug: 'test', description: '',
          longDescription: '', price: 1000, images: [], gradient: '',
          category: 'vibradores', tags: [], rating: 4, inStock: true, stockCount: 10, features: [],
        });
      });
      expect(result.current.products.length).toBe(2);
    });
  });

  describe('Categories CRUD', () => {
    it('loads categories', async () => {
      localStorage.setItem('discretastore-auth-token', 'mock-token');
      const { result } = renderHook(() => useAdmin(), { wrapper });
      await act(async () => { await result.current.login(); });
      await waitFor(() => { expect(result.current.loading).toBe(false); });
      expect(result.current.categories.length).toBe(2);
    });
  });
});
