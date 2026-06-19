import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Sparkles, SlidersHorizontal, X, Search } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { PRICE_MAX, PRICE_STEP } from "../../constants";
import { fetchProducts } from "../../api/products";
import { fetchCategories } from "../../api/categories";
import { categoryIcons } from "../../data/categories";
import type { Product } from "../../types";
import type { Category } from "../../types";
import ProductCard from "../../components/ProductCard";
import { SkeletonProductGrid } from "../../components/Skeleton";

type SortKey = "default" | "price-asc" | "price-desc" | "rating" | "name";

export default function Products() {
  usePageMeta("Productos", "Explora nuestra colección curada de productos para el bienestar y el placer. Envío discreto a todo Chile.");

  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("categoria") || "";
  const searchQuery = searchParams.get("search") || "";
  const [priceRange, setPriceRange] = useState<[number, number]>([0, PRICE_MAX]);
  const [sortBy, setSortBy] = useState<SortKey>("default");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPriceRange([0, PRICE_MAX]);
  }, [searchQuery]);

  // Fetch real data from API
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [loadedProducts, loadedCategories] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
        ]);
        if (mounted) {
          setProducts(loadedProducts);
          setCategories(loadedCategories);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError("Error al cargar productos. Intenta de nuevo más tarde.");
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      if (activeCategory && p.category !== activeCategory) return false;
      if (priceRange[1] < PRICE_MAX && p.price > priceRange[1]) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesTags = p.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesTags) return false;
      }
      return true;
    });

    switch (sortBy) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return result;
  }, [activeCategory, priceRange, searchQuery, sortBy, products]);

  const resetAllFilters = () => {
    const params = new URLSearchParams();
    setSearchParams(params);
    setPriceRange([0, PRICE_MAX]);
    setSortBy("default");
  };

  const setCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    if (slug) params.set("categoria", slug);
    else params.delete("categoria");
    setSearchParams(params);
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    setSearchParams(params);
  };

  const hasActiveFilters = activeCategory || priceRange[1] < PRICE_MAX || sortBy !== "default";

  return (
    <div className="page page-products animate-in">
      <div className="products-top">
        <div>
          <h2>Productos</h2>
          <p className="page-subtitle">Explora nuestra colección curada</p>
        </div>
        <button
          className="btn-filter-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Filtros"
        >
          <SlidersHorizontal size={18} />
          <span>Filtros</span>
        </button>
      </div>

      {searchQuery && (
        <div className="search-results-banner">
          <span className="banner-icon"><Search size={14} /></span>
          <span>
            Búsqueda: <strong>"{searchQuery}"</strong> ({filtered.length}{" "}
            {filtered.length === 1 ? "coincidencia" : "coincidencias"})
          </span>
          <button className="btn-clear-search" onClick={clearSearch} title="Limpiar búsqueda">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="products-layout">
        {/* ===== SIDEBAR ===== */}
        <aside className={`products-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-header">
            <h3>
              <SlidersHorizontal size={16} />
              Filtros
            </h3>
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Cerrar filtros">
              <X size={18} />
            </button>
          </div>

          <div className="filter-section">
            <h3 className="filter-label">Categorías</h3>
            <div className="filter-chips">
              <button
                className={`filter-chip ${!activeCategory ? "active" : ""}`}
                onClick={() => setCategory("")}
              >
                <Sparkles size={14} />
                <span>Todas</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`filter-chip ${activeCategory === cat.slug ? "active" : ""}`}
                  onClick={() => setCategory(cat.slug)}
                >
                  {categoryIcons[cat.id] || <Sparkles size={14} />}
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-label">Rango de Precio</h3>
            <div className="price-filter-wrapper">
              <div className="price-range-display">
                <span>$0</span>
                <span>—</span>
                <span className="price-max-display">${priceRange[1].toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={0}
                max={String(PRICE_MAX)}
                step={String(PRICE_STEP)}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, Math.min(PRICE_MAX, parseInt(e.target.value) || 0)])}
                className="price-range-slider"
                aria-label="Filtrar por precio"
                style={{
                  background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${(priceRange[1] / PRICE_MAX) * 100}%, var(--border) ${(priceRange[1] / PRICE_MAX) * 100}%, var(--border) 100%)`,
                }}
              />
              <div className="price-range-labels">
                <span>$0</span>
                <span>${PRICE_MAX.toLocaleString()}+</span>
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <button className="btn-reset-filters" onClick={resetAllFilters}>
              <X size={14} />
              Limpiar Filtros
            </button>
          )}
        </aside>

        {/* ===== OVERLAY (mobile) ===== */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        {/* ===== CONTENT ===== */}
        <div className="products-content">
          <div className="products-header">
            <span className="products-count">{filtered.length} producto{filtered.length !== 1 ? "s" : ""}</span>
            <div className="sort-controls">
              <label className="sort-label">Ordenar</label>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                aria-label="Ordenar por"
              >
                <option value="default">Relevancia</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="rating">Mejor puntuados</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>
          </div>

          {loading ? (
            <SkeletonProductGrid count={6} />
          ) : error ? (
            <div className="products-empty">
              <div className="empty-icon">
                <Search size={32} />
              </div>
              <h3>Error de conexión</h3>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Reintentar
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="products-empty">
              <div className="empty-icon">
                <Search size={32} />
              </div>
              <h3>Sin resultados</h3>
              <p>No encontramos productos con esos filtros.</p>
              <button className="btn btn-primary" onClick={resetAllFilters}>
                Restablecer tienda
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filtered.map((p, i) => (
                <div key={p.id} className="product-grid-item" style={{ animationDelay: `${i * 0.035}s` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
