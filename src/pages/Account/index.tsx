import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Package, Heart, LogOut, ShoppingBag } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { fetchProducts } from "../../api/products";

export default function Account() {
  usePageMeta("Mi Cuenta", "Administra tu cuenta de DiscretaStore.");
  const { user, isAuthenticated, logout } = useAuth();
  const { favorites } = useWishlist();
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    fetchProducts()
      .then((all) => setFavCount(all.filter((p) => favorites.includes(p.id)).length))
      .catch(() => setFavCount(0));
  }, [favorites]);

  if (!isAuthenticated || !user) {
    return (
      <div className="page page-account animate-in">
        <div className="cart-empty">
          <div className="empty-icon">
            <User size={36} />
          </div>
          <h2>Inicia sesión para ver tu cuenta</h2>
          <p>Necesitas iniciar sesión para acceder a tu perfil, pedidos y favoritos.</p>
          <Link to="/login" className="btn btn-primary">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-account animate-in">
      <div className="account-hero">
        <span className="hero-accent" />
        <h2>Mi Cuenta</h2>
      </div>

      <div className="account-card">
        <div className="account-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="account-info">
          <h3>{user.name}</h3>
          <p className="account-email">
            <Mail size={14} />
            {user.email}
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={logout}>
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>

      <div className="account-stats">
        <div className="account-stat-card">
          <Package size={20} />
          <span className="account-stat-value">0</span>
          <span className="account-stat-label">Pedidos</span>
        </div>
        <Link to="/wishlist" className="account-stat-card">
          <Heart size={20} />
          <span className="account-stat-value">{favCount}</span>
          <span className="account-stat-label">Favoritos</span>
        </Link>
      </div>

      <div className="account-section">
        <h3>Pedidos recientes</h3>
        <div className="account-empty-state">
          <ShoppingBag size={24} />
          <p>No tienes pedidos todavía.</p>
          <Link to="/productos" className="btn btn-primary">
            Explorar productos
          </Link>
        </div>
      </div>
    </div>
  );
}
