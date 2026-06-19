import { useState, useEffect, useRef } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { DEBOUNCE_MS, SUGGESTIONS_MAX } from "../constants";
import { useDebounce } from "../hooks/useDebounce";
import { fetchProducts } from "../api/products";
import type { Product } from "../types";
import logoImg from "../img/logo.png";
import Breadcrumbs from "./Breadcrumbs";
import WhatsAppButton from "./WhatsAppButton";
import TrackingScripts from "./TrackingScripts";

export default function Layout() {
  const { totalItems } = useCart();
  const { favorites } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Tema (Modo Oscuro)
  const [theme, setTheme] = useState(() => localStorage.getItem("discretastore-theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("discretastore-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  // Buscador
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);
  const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_MS);

  // Buscar productos desde la API
  useEffect(() => {
    let mounted = true;
    if (debouncedSearch.trim().length > 1) {
      fetchProducts({ search: debouncedSearch })
        .then((results) => {
          if (mounted) setSuggestions(results.slice(0, SUGGESTIONS_MAX));
        })
        .catch(() => { if (mounted) setSuggestions([]); });
    } else {
      setSuggestions([]);
    }
    return () => { mounted = false; };
  }, [debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/productos?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSuggestions(false);
      closeMenu();
    }
  };

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="App">
      <header className="App-header">
        <Link to="/" className="header-brand" onClick={closeMenu}>
          <img src={logoImg} alt="" className="header-logo" />
          <span className="header-brand-text">DiscretaStore</span>
        </Link>
        
        <nav className={`nav-desktop ${menuOpen ? "nav-open" : ""}`}>
          <NavLink to="/" end className="nav-link" onClick={closeMenu}>Inicio</NavLink>
          <NavLink to="/productos" className="nav-link" onClick={closeMenu}>Productos</NavLink>
          <NavLink to="/about" className="nav-link" onClick={closeMenu}>Nosotros</NavLink>
          <NavLink to="/contact" className="nav-link" onClick={closeMenu}>Contacto</NavLink>
        </nav>

        <form className="header-search" onSubmit={handleSearchSubmit} ref={searchRef}>
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              aria-label="Buscar productos"
            />
            <button type="submit" className="search-btn" aria-label="Buscar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="search-suggestions">
              {suggestions.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/productos/${p.slug}`}
                    onClick={() => {
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                  >
                    <div className="suggestion-image" style={{ background: p.gradient }}>
                      <img src={p.images[0]} alt="" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div className="suggestion-info">
                      <span className="suggestion-name">{p.name}</span>
                      <span className="suggestion-price">${p.price.toLocaleString()}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className="header-actions">
          <button
            className="nav-link icon-link theme-toggle"
            onClick={toggleTheme}
            title={theme === "light" ? "Modo oscuro" : "Modo claro"}
            aria-label="Alternar tema"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
            {theme === "light" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
          
          {isAuthenticated ? (
            <div className="nav-link user-menu" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Link to="/account" style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--heading)", textDecoration: "none" }} title="Mi Cuenta">
                {user?.name}
              </Link>
              <button
                onClick={logout}
                className="icon-link"
                title="Cerrar sesión"
                style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", padding: "4px", color: "var(--text-secondary)" }}
                aria-label="Cerrar sesión"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="nav-link icon-link" title="Iniciar sesión">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </NavLink>
          )}
          
          <NavLink to="/wishlist" className="nav-link icon-link" title="Favoritos" onClick={closeMenu} style={{ position: "relative" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {favorites.length > 0 && <span className="cart-badge" style={{ right: "-2px", top: "-2px" }}>{favorites.length}</span>}
          </NavLink>

          <NavLink to="/cart" className="nav-link cart-link" title="Carrito" onClick={closeMenu}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </NavLink>
          
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
            <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
          </button>
        </div>
      </header>
      {menuOpen && <div className="nav-overlay" onClick={closeMenu} />}
      <TrackingScripts />

      <main className="App-main">
        <Breadcrumbs />
        <Outlet />
      </main>
      <WhatsAppButton />

      <footer className="App-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" className="footer-logo-link">
              <img src={logoImg} alt="DiscretaStore" className="footer-logo" />
            </Link>
            <p>Placer con consciencia. Discreción con estilo.</p>
          </div>
          <div className="footer-links">
            <div>
              <h4>Explorar</h4>
              <Link to="/productos">Productos</Link>
              <Link to="/about">Nosotros</Link>
              <Link to="/contact">Contacto</Link>
              <Link to="/wishlist">Favoritos</Link>
            </div>
            <div>
              <h4>Ayuda</h4>
              <Link to="/envios">Envíos</Link>
              <Link to="/devoluciones">Devoluciones</Link>
              <Link to="/faq">FAQ</Link>
              <Link to="/order-status">Estado de Pedido</Link>
            </div>
            <div>
              <h4>Mi Cuenta</h4>
              <Link to="/account">Mi Perfil</Link>
              <Link to="/wishlist">Mis Favoritos</Link>
              <Link to="/order-status">Mis Pedidos</Link>
            </div>
            <div>
              <h4>Legal</h4>
              <Link to="/terminos">Términos</Link>
              <Link to="/privacidad">Privacidad</Link>
            </div>
          </div>
        </div>
        <p className="footer-copy">&copy; {new Date().getFullYear()} DiscretaStore — Hecho con cuidado — <Link to="/admin" style={{ fontSize: "0.7rem", opacity: 0.5 }}>Admin</Link></p>
      </footer>
    </div>
  );
}

