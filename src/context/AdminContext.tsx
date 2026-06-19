import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Product, Category } from "../types";
import { fetchProducts } from "../api/products";
import { fetchCategories } from "../api/categories";
import { request } from "../api/client";

const AUTH_ADMIN_KEY = "discretastore-admin-auth";

interface AdminStats {
  totalProducts: number;
  totalCategories: number;
  lowStock: number;
  outOfStock: number;
  avgPrice: number;
  featured: number;
  withDiscount: number;
  totalOrders: number;
  totalUsers: number;
  maintenance: boolean;
}

export interface AdminContextType {
  isAdmin: boolean;
  login: () => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  error: string | null;

  products: Product[];
  addProduct: (p: Product) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  categories: Category[];
  addCategory: (c: Category) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  stats: AdminStats;
  refresh: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

function generateId(prefix: string, existing: { id: string }[]): string {
  // Usar el slug como ID legible, no UUID
  const existingIds = new Set(existing.map(e => e.id));
  if (!existingIds.has(prefix)) return prefix;
  let counter = 2;
  while (existingIds.has(`${prefix}-${counter}`)) counter++;
  return `${prefix}-${counter}`;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    try { return !!localStorage.getItem(AUTH_ADMIN_KEY); } catch { return false; }
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalProducts: 0, totalCategories: 0, lowStock: 0, outOfStock: 0, avgPrice: 0,
    featured: 0, withDiscount: 0, totalOrders: 0, totalUsers: 0, maintenance: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [prods, cats, dashboard] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        request<AdminStats>('/admin/dashboard'),
      ]);
      setProducts(prods);
      setCategories(cats);
      setStats(dashboard);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
      setIsAdmin(false); // Si falla refresh, probablemente el token expiró
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin, refresh]);

  const login = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem("discretastore-auth-token");
    if (!token) return false;

    try {
      const dashboard = await request<AdminStats>('/admin/dashboard');
      if (dashboard && typeof dashboard.totalProducts === 'number') {
        setIsAdmin(true);
        localStorage.setItem(AUTH_ADMIN_KEY, "true");
        return true;
      }
    } catch {
      // Token inválido o no admin
      localStorage.removeItem("discretastore-auth-token");
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAdmin(false);
    setProducts([]);
    setCategories([]);
    localStorage.removeItem(AUTH_ADMIN_KEY);
  }, []);

  const addProduct = useCallback(async (p: Product) => {
    await request('/admin/products', {
      method: 'POST',
      body: p,
    });
    await refresh();
  }, [refresh]);

  const updateProduct = useCallback(async (id: string, data: Partial<Product>) => {
    await request('/admin/products/update', {
      method: 'PUT',
      body: { id, ...data },
    });
    await refresh();
  }, [refresh]);

  const deleteProduct = useCallback(async (id: string) => {
    await request('/admin/products/delete', {
      method: 'DELETE',
      body: { id },
    });
    await refresh();
    // Clean orphaned references
    try {
      const cart = JSON.parse(localStorage.getItem("discretastore-cart") || "[]");
      const filtered = Array.isArray(cart) ? cart.filter((item: { product?: { id: string } }) => item.product?.id !== id) : cart;
      localStorage.setItem("discretastore-cart", JSON.stringify(filtered));
      const wishlist = JSON.parse(localStorage.getItem("discretastore-wishlist") || "[]");
      const filteredWish = Array.isArray(wishlist) ? wishlist.filter((pid: string) => pid !== id) : wishlist;
      localStorage.setItem("discretastore-wishlist", JSON.stringify(filteredWish));
    } catch { /* ignore */ }
  }, [refresh]);

  const addCategory = useCallback(async (c: Category) => {
    await request('/admin/categories', {
      method: 'POST',
      body: c,
    });
    await refresh();
  }, [refresh]);

  const updateCategory = useCallback(async (id: string, data: Partial<Category>) => {
    await request('/admin/categories/update', {
      method: 'PUT',
      body: { id, ...data },
    });
    await refresh();
  }, [refresh]);

  const deleteCategory = useCallback(async (id: string) => {
    await request('/admin/categories/delete', {
      method: 'DELETE',
      body: { id },
    });
    await refresh();
  }, [refresh]);

  return (
    <AdminContext.Provider value={{
      isAdmin, login, logout, loading, error,
      products, addProduct, updateProduct, deleteProduct,
      categories, addCategory, updateCategory, deleteCategory,
      stats, refresh,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

export { generateId };
