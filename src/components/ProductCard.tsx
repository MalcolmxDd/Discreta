import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, Eye, Sparkles, ShoppingCart } from "lucide-react";
import type { Product } from "../types";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { categoryIconsSmall } from "../data/categories";

interface Props {
  product: Product;
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="card-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={`card-star ${s <= value ? "filled" : "empty"}`}
          fill={s <= value ? "#f1c40f" : "none"}
        />
      ))}
    </span>
  );
}

export default function ProductCard({ product }: Props) {
  const { toggleFavorite, isFavorite } = useWishlist();
  const { addItem } = useCart();
  const { addToast } = useToast();
  const [adding, setAdding] = useState(false);
  const isFav = isFavorite(product.id);
  const cardRef = useRef<HTMLAnchorElement>(null);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock) return;
    setAdding(true);
    addItem(product, 1);
    addToast(`${product.name} agregado al carrito`, "success");
    setTimeout(() => setAdding(false), 1200);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current?.querySelector(".product-card-image") as HTMLElement | null;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(400px) rotateY(${x * 4}deg) rotateX(${y * -3}deg)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current?.querySelector(".product-card-image") as HTMLElement | null;
    if (card) {
      card.style.transform = "perspective(400px) rotateY(0deg) rotateX(0deg)";
    }
  };

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = "none";
  };

  return (
    <Link
      ref={cardRef}
      to={`/productos/${product.slug}`}
      className="product-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="product-card-image" style={{ background: product.gradient }}>
        <div className="product-card-img-overlay" />
        <img src={product.images[0]} alt={product.name} className="product-card-img" loading="lazy" onError={handleImgError} />

        <button
          className={`favorite-btn ${isFav ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
          <Heart
            size={16}
            fill={isFav ? "currentColor" : "none"}
          />
        </button>

        <div className="product-card-overlay">
          <span className="product-card-view">
            <Eye size={14} />
            Ver detalle
          </span>
          {product.inStock && (
            <button className="product-card-add-btn" onClick={handleQuickAdd} title="Agregar al carrito" aria-label="Agregar al carrito">
              <ShoppingCart size={14} />
              {adding ? "✓" : "Agregar"}
            </button>
          )}
        </div>

        {product.originalPrice && (
          <span className="product-card-badge">
            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
          </span>
        )}
      </div>

      <div className="product-card-body">
        <div className="product-card-category">
          {categoryIconsSmall[product.category] || <Sparkles size={14} />}
          <span>{product.category}</span>
        </div>
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-desc">{product.description}</p>
        <div className="product-card-footer">
          <span className="product-card-price">
            {product.originalPrice && (
              <span className="product-card-original">${product.originalPrice.toLocaleString()}</span>
            )}
            ${product.price.toLocaleString()}
          </span>
          <div className="product-card-rating">
            <StarRating value={Math.round(product.rating)} />
            <span>{product.rating}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
