import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Heart,
  Check,
  Plus,
  Minus,
  ShoppingCart,
  ChevronLeft,
  Search,
  Sparkles,
  Star,
  Eye,
  Truck,
  Shield,
} from "lucide-react";
import { RELATED_MAX } from "../../constants";
import { usePageMeta } from "../../hooks/usePageMeta";
import { fetchProductBySlug, fetchProducts } from "../../api/products";
import { fetchReviewsByProduct } from "../../api/reviews";
import { fetchCategories } from "../../api/categories";
import type { Product } from "../../types";
import type { Review } from "../../types";
import ProductJsonLd from "../../components/ProductJsonLd";
import { categoryIcons } from "../../data/categories";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useToast } from "../../context/ToastContext";
import ProductCard from "../../components/ProductCard";
import ImageLightbox from "../../components/ImageLightbox";
import ReviewSection from "../../components/ReviewSection";
import { SkeletonProductDetail } from "../../components/Skeleton";

function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="detail-star-row">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={`detail-star ${s <= value ? "filled" : "empty"}`}
          fill={s <= value ? "#f1c40f" : "none"}
        />
      ))}
    </span>
  );
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [related, setRelated] = useState<Product[]>([]);
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const imageRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!slug) return;
      try {
        setLoading(true);
        const loadedProduct = await fetchProductBySlug(slug);
        if (!mounted) return;
        setProduct(loadedProduct);

        const [loadedCategories, reviewsData] = await Promise.all([
          fetchCategories(),
          fetchReviewsByProduct(loadedProduct.id),
        ]);
        if (!mounted) return;
        setProductReviews(reviewsData.reviews);
        const catName = loadedCategories.find((c) => c.id === loadedProduct.category)?.name || loadedProduct.category;
        setCategoryName(catName);

        // Productos relacionados
        const allProds = await fetchProducts({ category: loadedProduct.category });
        if (mounted) {
          setRelated(allProds.filter((p) => p.id !== loadedProduct.id).slice(0, RELATED_MAX));
        }
        if (mounted) setLoading(false);
      } catch {
        if (mounted) {
          setProduct(undefined);
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, [slug]);

  usePageMeta(
    product ? product.name : "Producto no encontrado",
    product ? product.description : undefined,
    product ? product.images[0] : undefined
  );

  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useWishlist();
  const { addToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Mouse parallax for image
  useEffect(() => {
    const el = imageRef.current;
    if (!el) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x, y });
    };
    el.addEventListener("mousemove", handleMouseMove);
    const handleLeave = () => setMousePos({ x: 0, y: 0 });
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  if (loading) {
    return (
      <div className="page page-product-detail animate-in">
        <SkeletonProductDetail />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page page-not-found animate-in">
        <div className="empty-icon">
          <Search size={32} />
        </div>
        <h2>Producto no encontrado</h2>
        <p>El producto que buscas no existe o fue removido.</p>
        <Link to="/productos" className="btn btn-primary">Ver todos los productos</Link>
      </div>
    );
  }

  const allImages = product.images;
  const isFav = isFavorite(product.id);

  const handleAdd = () => {
    addItem(product, quantity);
    setAdded(true);
    addToast(`${product.name} agregado al carrito`, "success");
    setTimeout(() => setAdded(false), 2000);
  };

  const imageTilt = `perspective(600px) rotateY(${mousePos.x * 5}deg) rotateX(${mousePos.y * -3}deg)`;

  return (
    <div className="page page-product-detail animate-in">
      <Link to="/productos" className="back-link">
        <ChevronLeft size={16} />
        Volver a productos
      </Link>

      <div className="detail-layout">
        {/* ===== IMAGE GALLERY ===== */}
        <div className="detail-image-section">
          <div
            ref={imageRef}
            className="detail-image"
            style={{ background: product.gradient, transform: imageTilt }}
            onClick={() => setLightboxOpen(true)}
          >
            <div className="detail-img-glow" aria-hidden="true" />
            <img
              src={allImages[selectedImageIndex]}
              alt={product.name}
              className="detail-img"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <button
              className="detail-zoom-btn"
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
              aria-label="Ampliar imagen"
            >
              <Eye size={18} />
            </button>
            {product.originalPrice && (
              <span className="product-card-badge">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="detail-thumbnails">
              {allImages.map((url, i) => (
                <button
                  key={i}
                  className={`detail-thumb ${i === selectedImageIndex ? "active" : ""}`}
                  onClick={() => setSelectedImageIndex(i)}
                  style={{ background: product.gradient }}
                >
                  <img
                    src={url}
                    alt={`${product.name} - vista ${i + 1}`}
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </button>
              ))}
            </div>
          )}

          <div className="detail-image-hints">
            <span>Hover para 3D · Click para ampliar</span>
          </div>

          {allImages.length > 1 && (
            <div className="detail-gallery-counter">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>{selectedImageIndex + 1} / {allImages.length}</span>
            </div>
          )}
        </div>

        {/* ===== INFO ===== */}
        <div className="detail-info">
          <div className="detail-category-row">
            {categoryIcons[product.category] || <Sparkles size={14} />}
            <span className="detail-category">{categoryName}</span>
          </div>

          <h2>{product.name}</h2>

          <div className="detail-rating">
            <StarRating value={Math.round(product.rating)} size={16} />
            <span className="detail-rating-value">{product.rating}</span>
            <span className="detail-rating-count">({productReviews.length} reseña{productReviews.length !== 1 ? "s" : ""})</span>
          </div>

          <div className="detail-price">
            {product.originalPrice && (
              <span className="detail-original">${product.originalPrice.toLocaleString()}</span>
            )}
            <span className="detail-current">${product.price.toLocaleString()}</span>
          </div>

          <p className="detail-desc">{product.longDescription}</p>

          <div className="detail-features">
            <h3>Características</h3>
            <ul>
              {product.features.map((f) => (
                <li key={f}>
                  <Check size={14} className="feature-check" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* ===== ACTIONS ===== */}
          <div className="detail-actions">
            <div className="quantity-selector">
              <button
                className="qty-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Reducir cantidad"
              >
                <Minus size={16} />
              </button>
              <span className="qty-value">{quantity}</span>
              <button
                className="qty-btn"
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
                disabled={quantity >= 99}
                aria-label="Aumentar cantidad"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="detail-add-group">
              <button className="btn btn-primary detail-add-btn" onClick={handleAdd} disabled={!product.inStock}>
                <ShoppingCart size={18} />
                {!product.inStock ? "Agotado" : added ? "✓ Agregado" : "Agregar al carrito"}
              </button>
              {added && (
                <Link to="/productos" className="btn btn-outline" style={{ fontSize: "0.82rem" }}>
                  Seguir comprando
                </Link>
              )}
            </div>

            <button
              className={`btn btn-secondary detail-fav-btn ${isFav ? "active" : ""}`}
              onClick={() => toggleFavorite(product.id)}
              title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <Heart
                size={18}
                fill={isFav ? "currentColor" : "none"}
              />
            </button>
          </div>

          {/* ===== STOCK & TRUST ===== */}
          <div className="detail-meta">
            <div className={`stock-badge ${product.inStock ? "in-stock" : "out-of-stock"}`}>
              <span className="stock-dot" />
              {product.inStock
                ? product.stockCount > 0 && product.stockCount <= 5
                  ? `Solo quedan ${product.stockCount}`
                  : "En stock"
                : "Agotado"}
            </div>
            <div className="detail-trust">
              <div className="detail-trust-item">
                <Truck size={14} />
                <span>Envío discreto</span>
              </div>
              <div className="detail-trust-item">
                <Shield size={14} />
                <span>Pago seguro</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductJsonLd product={product} />

      {/* ===== LIGHTBOX ===== */}
      {lightboxOpen && (
        <ImageLightbox
          src={allImages[selectedImageIndex]}
          alt={product.name}
          onClose={() => setLightboxOpen(false)}
          images={allImages}
          currentIndex={selectedImageIndex}
          onNavigate={setSelectedImageIndex}
        />
      )}

      {/* ===== FEATURES STRIP ===== */}
      <div className="detail-strip">
        {[
          { icon: Truck, text: "Envío discreto a todo Chile" },
          { icon: Shield, text: "Pago 100% seguro" },
          { icon: Heart, text: "Atención personalizada" },
          { icon: Star, text: "Calidad garantizada" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="strip-item">
              <Icon size={16} />
              <span>{item.text}</span>
            </div>
          );
        })}
      </div>

      {/* ===== RELATED ===== */}
      {related.length > 0 && (
        <section className="section-related">
          <div className="related-header">
            <h2 className="section-title">Relacionados</h2>
            <Link to={`/productos?categoria=${product.category}`} className="section-link">
              Ver todos <ChevronLeft size={14} style={{ transform: "rotate(180deg)" }} />
            </Link>
          </div>
          <div className="products-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ===== REVIEWS ===== */}
      <ReviewSection productId={product.id} reviews={productReviews} />
    </div>
  );
}
