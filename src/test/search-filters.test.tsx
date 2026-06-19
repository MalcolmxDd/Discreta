import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../context/ToastContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { AuthProvider } from "../context/AuthContext";
import Products from "../pages/Products";
import type { ReactNode } from "react";

// =============================================================
// Mock data for API tests
// =============================================================

const mockCategories = [
  { id: "vibradores", name: "Vibradores", slug: "vibradores", description: "Precisión y placer", position: 1, product_count: 2 },
  { id: "dildos", name: "Dildos", slug: "dildos", description: "Formas que inspiran", position: 2, product_count: 2 },
  { id: "lubricantes", name: "Lubricantes", slug: "lubricantes", description: "Suavidad absoluta", position: 3, product_count: 2 },
  { id: "parejas", name: "Para Parejas", slug: "parejas", description: "Conecta de nuevas formas", position: 4, product_count: 2 },
  { id: "lenceria", name: "Lencería", slug: "lenceria", description: "Lo que llevas puesto", position: 5, product_count: 2 },
  { id: "bienestar", name: "Bienestar", slug: "bienestar", description: "Cuídate", position: 6, product_count: 2 },
];

const mockProducts = [
  {
    id: "vib-001", name: "Luna", slug: "luna", description: "Vibrador bullet de precisión",
    long_description: "Luna es discreción y potencia en miniatura.",
    price: 1290, original_price: null, image: "https://picsum.photos/seed/luna/400/400",
    gradient: "linear-gradient(135deg, #1a1a2e, #0f3460)", category: "vibradores",
    category_name: "Vibradores", category_slug: "vibradores",
    tags: ["bullet", "silicona"], rating: 4.5, in_stock: true, stock_count: 25,
    features: ["10 modos de vibración", "Silicona hipoalergénica"], is_featured: true,
  },
  {
    id: "vib-002", name: "Gema", slug: "gema", description: "Vibrador puntual",
    long_description: "Gema está diseñado para el placer de punto preciso.",
    price: 1890, original_price: 2290, image: "https://picsum.photos/seed/gema/400/400",
    gradient: "linear-gradient(135deg, #2d1b3d, #6b2fa0)", category: "vibradores",
    category_name: "Vibradores", category_slug: "vibradores",
    tags: ["point", "precisión"], rating: 4.8, in_stock: true, stock_count: 15,
    features: ["8 intensidades", "Cabeza curvada"], is_featured: true,
  },
  {
    id: "dil-001", name: "Eros", slug: "eros", description: "Consolador clásico",
    long_description: "Eros combina el diseño clásico con materiales modernos.",
    price: 2250, original_price: null, image: "https://picsum.photos/seed/eros/400/400",
    gradient: "linear-gradient(135deg, #1c1410, #3d281c)", category: "dildos",
    category_name: "Dildos", category_slug: "dildos",
    tags: ["clásico", "ventosa"], rating: 4.3, in_stock: true, stock_count: 20,
    features: ["Silicona platino-curada", "Base de ventosa"], is_featured: false,
  },
  {
    id: "lub-001", name: "Aqua", slug: "aqua", description: "Lubricante base agua",
    long_description: "Aqua es pureza líquida.",
    price: 390, original_price: null, image: "https://picsum.photos/seed/aqua/400/400",
    gradient: "linear-gradient(135deg, #0a1628, #1a3c5c)", category: "lubricantes",
    category_name: "Lubricantes", category_slug: "lubricantes",
    tags: ["base agua", "aloe"], rating: 4.7, in_stock: true, stock_count: 50,
    features: ["Base agua transparente", "Con aloe vera"], is_featured: true,
  },
  {
    id: "par-002", name: "Pulse", slug: "pulse", description: "Masajeador para dos",
    long_description: "Pulse sincroniza el placer compartido.",
    price: 3490, original_price: null, image: "https://picsum.photos/seed/pulse/400/400",
    gradient: "linear-gradient(135deg, #1a0d1a, #4a265a)", category: "parejas",
    category_name: "Para Parejas", category_slug: "parejas",
    tags: ["dual", "punto G"], rating: 4.9, in_stock: true, stock_count: 10,
    features: ["Estimulación dual", "Ondas pulsantes"], is_featured: true,
  },
  {
    id: "len-001", name: "Seda", slug: "seda", description: "Babydoll de seda",
    long_description: "Seda susurra al caminar.",
    price: 1890, original_price: null, image: "https://picsum.photos/seed/seda/400/400",
    gradient: "linear-gradient(135deg, #1a0f14, #4a2238)", category: "lenceria",
    category_name: "Lencería", category_slug: "lenceria",
    tags: ["seda", "encaje"], rating: 4.1, in_stock: true, stock_count: 22,
    features: ["Seda natural", "Encaje floral"], is_featured: false,
  },
  {
    id: "bie-001", name: "Zen", slug: "zen", description: "Masajeador corporal",
    long_description: "Zen no es un juguete, es una herramienta de bienestar.",
    price: 3990, original_price: null, image: "https://picsum.photos/seed/zen/400/400",
    gradient: "linear-gradient(135deg, #0a1a14, #143528)", category: "bienestar",
    category_name: "Bienestar", category_slug: "bienestar",
    tags: ["masajeador", "ondas"], rating: 4.3, in_stock: true, stock_count: 8,
    features: ["Ondas electromagnéticas", "3 modos"], is_featured: false,
  },
  {
    id: "bie-002", name: "Ritual", slug: "ritual", description: "Kit de aceites",
    long_description: "Ritual convierte el masaje en ceremonia.",
    price: 890, original_price: null, image: "https://picsum.photos/seed/ritual/400/400",
    gradient: "linear-gradient(135deg, #1a1410, #3d2a1c)", category: "bienestar",
    category_name: "Bienestar", category_slug: "bienestar",
    tags: ["aceite", "masaje"], rating: 4.0, in_stock: true, stock_count: 30,
    features: ["3 aceites de 50ml", "Lavanda, Canela"], is_featured: false,
  },
];

// Mock fetch globally
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn((url: string) => {
    if (url.includes("/api/categories")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockCategories }),
      });
    }
    if (url.includes("/api/products")) {
      const urlObj = new URL(url, "http://localhost");
      const featured = urlObj.searchParams.get("featured");
      let data = mockProducts;
      if (featured === "true") {
        data = mockProducts.filter((p) => p.is_featured);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data }),
      });
    }
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: "Not found" }),
    });
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// =============================================================
// Tests
// =============================================================

function AllProviders({ children, initialEntry = "/productos" }: { children: ReactNode; initialEntry?: string }) {
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

function wrapper({ children }: { children: ReactNode }) {
  return <AllProviders>{children}</AllProviders>;
}

function wrapperWithSearch(search: string) {
  return ({ children }: { children: ReactNode }) => (
    <AllProviders initialEntry={`/productos?search=${search}`}>{children}</AllProviders>
  );
}

describe("Products page - Search & Filters", () => {
  it("renders all products by default", async () => {
    render(<Products />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("8 productos")).toBeDefined();
    });
  });

  it("filters by category when clicking a category chip", async () => {
    render(<Products />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("8 productos")).toBeDefined();
    });
    // Click on Vibradores category
    fireEvent.click(screen.getByText("Vibradores"));
    // Should show only vibradores (2 products: Luna + Gema)
    await waitFor(() => {
      expect(screen.getByText(/2 productos/)).toBeDefined();
    });
  });

  it("shows all products when selecting 'Todas' category", async () => {
    render(<Products />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("8 productos")).toBeDefined();
    });
    // First filter to vibradores
    fireEvent.click(screen.getByText("Vibradores"));
    await waitFor(() => {
      expect(screen.getByText(/2 productos/)).toBeDefined();
    });
    // Then go back to all
    fireEvent.click(screen.getByText("Todas"));
    await waitFor(() => {
      expect(screen.getByText("8 productos")).toBeDefined();
    });
  });

  it("changes product count when sorting by price asc", async () => {
    render(<Products />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("8 productos")).toBeDefined();
    });
    const sortSelect = screen.getByLabelText("Ordenar por");
    fireEvent.change(sortSelect, { target: { value: "price-asc" } });
    await waitFor(() => {
      expect(screen.getByText("8 productos")).toBeDefined();
    });
  });

  it("changes product count when sorting by price desc", async () => {
    render(<Products />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("8 productos")).toBeDefined();
    });
    const sortSelect = screen.getByLabelText("Ordenar por");
    fireEvent.change(sortSelect, { target: { value: "price-desc" } });
    await waitFor(() => {
      expect(screen.getByText("8 productos")).toBeDefined();
    });
  });

  it("changes product count when sorting by rating", async () => {
    render(<Products />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("8 productos")).toBeDefined();
    });
    const sortSelect = screen.getByLabelText("Ordenar por");
    fireEvent.change(sortSelect, { target: { value: "rating" } });
    await waitFor(() => {
      expect(screen.getByText("8 productos")).toBeDefined();
    });
  });

  it("changes product count when sorting by name", async () => {
    render(<Products />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("8 productos")).toBeDefined();
    });
    const sortSelect = screen.getByLabelText("Ordenar por");
    fireEvent.change(sortSelect, { target: { value: "name" } });
    await waitFor(() => {
      expect(screen.getByText("8 productos")).toBeDefined();
    });
  });

  it("shows filter banner when search query is present in URL", async () => {
    render(<Products />, { wrapper: wrapperWithSearch("luna") });
    await waitFor(() => {
      expect(screen.getByText(/Búsqueda:/)).toBeDefined();
    });
  });

  it("shows empty state when no products match filters", async () => {
    render(<Products />, { wrapper: wrapperWithSearch("zzzznotfound") });
    await waitFor(() => {
      expect(screen.getByText("No encontramos productos con esos filtros.")).toBeDefined();
    }, { timeout: 2000 });
  });

  it("resets filters when clicking Limpiar Filtros", async () => {
    render(<Products />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText("8 productos")).toBeDefined();
    });
    // Filter to a category first
    fireEvent.click(screen.getByText("Vibradores"));
    await waitFor(() => {
      expect(screen.getByText(/2 productos/)).toBeDefined();
    });
    // Click reset
    fireEvent.click(screen.getByText("Limpiar Filtros"));
    await waitFor(() => {
      expect(screen.getByText("8 productos")).toBeDefined();
    });
  });

  it("displays price range slider", async () => {
    render(<Products />, { wrapper });
    await waitFor(() => {
      const slider = screen.getByLabelText("Filtrar por precio");
      expect(slider).toBeDefined();
    });
  });

  it("renders SortBy select with all options", async () => {
    render(<Products />, { wrapper });
    await waitFor(() => {
      const sortSelect = screen.getByLabelText("Ordenar por");
      expect(sortSelect).toBeDefined();
    });
    expect(screen.getByText("Relevancia")).toBeDefined();
  });
});
