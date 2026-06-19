import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useWishlist } from "../../context/WishlistContext";
import { useAuth } from "../../context/AuthContext";
import { fetchProducts } from "../../api/products";
import { fetchWishlistProducts } from "../../api/wishlist";
import type { Product } from "../../types";
import ProductCard from "../../components/ProductCard";

export default function Wishlist() {
  usePageMeta("Favoritos");
  const { favorites } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [favProducts, setFavProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (isAuthenticated) {
      fetchWishlistProducts()
        .then(setFavProducts)
        .catch(() => setFavProducts([]))
        .finally(() => setLoading(false));
    } else {
      fetchProducts()
        .then((all) => setFavProducts(all.filter((p) => favorites.includes(p.id))))
        .catch(() => setFavProducts([]))
        .finally(() => setLoading(false));
    }
  }, [favorites, isAuthenticated]);

  if (!loading && favProducts.length === 0) {
    return (
      <div className="page page-wishlist animate-in">
        <div className="cart-empty">
          <div className="empty-icon">
            <Heart size={36} />
          </div>
          <h2>Tu lista de favoritos está vacía</h2>
          <p>Guardá tus productos favoritos con el corazón y volvé a encontrarlos acá.</p>
          <Link to="/productos" className="btn btn-primary">
            <ShoppingBag size={16} />
            Explorar productos
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page page-wishlist animate-in">
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
          <div className="skeleton" style={{ width: 60, height: 60, borderRadius: "50%" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page page-wishlist animate-in">
      <div className="wishlist-header">
        <div>
          <h2>Favoritos</h2>
          <p className="page-subtitle">{favProducts.length} {favProducts.length === 1 ? "producto" : "productos"}</p>
        </div>
        <Heart size={20} className="wishlist-header-icon" fill="var(--accent)" />
      </div>

      <div className="products-grid">
        {favProducts.map((p, i) => (
          <div key={p.id} className="product-grid-item" style={{ animationDelay: `${i * 0.04}s` }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
