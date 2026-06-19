import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Truck, Shield, ArrowRight, Sparkles } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useCart } from "../../context/CartContext";
import { categoryIconsSmall } from "../../data/categories";

export default function Cart() {
  usePageMeta("Carrito");
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="page page-cart animate-in">
        <div className="cart-empty">
          <div className="empty-icon">
            <ShoppingBag size={36} />
          </div>
          <h2>Tu carrito está vacío</h2>
          <p>Explora nuestra colección y agrega algo que te inspire.</p>
          <Link to="/productos" className="btn btn-primary">
            <ShoppingBag size={16} />
            Explorar productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-cart animate-in">
      <div className="cart-header">
        <div>
          <h2>Carrito</h2>
          <p className="page-subtitle">
            {totalItems} {totalItems === 1 ? "producto" : "productos"} en tu carrito
          </p>
        </div>
        <Link to="/productos" className="btn btn-outline btn-sm">
          <ArrowLeft size={14} />
          Seguir comprando
        </Link>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map(({ product, quantity }, i) => (
            <div
              key={product.id}
              className="cart-item"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="cart-item-image" style={{ background: product.gradient }}>
                <img src={product.images[0]} alt={product.name} className="cart-item-img" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>

              <div className="cart-item-info">
                <div className="cart-item-category">
                  {categoryIconsSmall[product.category] || <Sparkles size={12} />}
                  <span>{product.category}</span>
                </div>
                <Link to={`/productos/${product.slug}`} className="cart-item-name">
                  {product.name}
                </Link>
                <span className="cart-item-price">${product.price.toLocaleString()} c/u</span>
              </div>

              <div className="cart-item-quantity">
                <button
                  className="qty-btn-sm"
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  disabled={quantity <= 1}
                  aria-label="Reducir cantidad"
                >
                  <Minus size={14} />
                </button>
                <span className="qty-value-sm">{quantity}</span>
                <button
                  className="qty-btn-sm"
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  disabled={quantity >= 99}
                  aria-label="Aumentar cantidad"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="cart-item-total">
                <span className="cart-total-label">Total</span>
                <span className="cart-total-value">${(product.price * quantity).toLocaleString()}</span>
              </div>

              <button
                className="cart-item-remove"
                onClick={() => removeItem(product.id)}
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Resumen</h3>

          <div className="summary-rows">
            <div className="summary-row">
              <span>Subtotal ({totalItems} {totalItems === 1 ? "ítem" : "ítems"})</span>
              <span>${totalPrice.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Envío</span>
              <span className="summary-free">Calculado al pagar</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>${totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="summary-trust">
            <div className="summary-trust-item">
              <Truck size={14} />
              <span>Envío discreto</span>
            </div>
            <div className="summary-trust-item">
              <Shield size={14} />
              <span>Pago seguro</span>
            </div>
          </div>

          <Link to="/checkout" className="btn btn-primary btn-block">
            Proceder al pago
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
