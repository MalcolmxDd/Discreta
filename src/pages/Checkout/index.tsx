import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  MapPin,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Shield,
  Tag,
  Sparkles,
  Loader,
} from "lucide-react";
import {
  CHILEAN_REGIONS,
  SHIPPING_COST_RM,
  SHIPPING_COST_REGIONS,
  SHIPPING_COST_EXTREME,
  EXTREME_REGIONS,
} from "../../constants";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { categoryIconsSmall } from "../../data/categories";
import { validateCoupon } from "../../api/coupons";
import { createPaymentPreference } from "../../api/mercadoPago";

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  region?: string;
  comuna?: string;
  zip?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateZip(zip: string): boolean {
  return /^\d{4,8}$/.test(zip);
}

export default function Checkout() {
  usePageMeta("Checkout");
  const { items, totalPrice, clearCart, removeItem, totalItems } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Manejar retorno de MercadoPago (failure/pending via query params)
  const statusParam = searchParams.get("status");

  useEffect(() => {
    if (statusParam === "failure") {
      addToast("El pago no pudo completarse. Intenta de nuevo.", "error");
    } else if (statusParam === "pending") {
      addToast("Tu pago está pendiente. Te notificaremos cuando se confirme.", "info");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    region: "Región Metropolitana",
    comuna: "",
    zip: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);

  const shippingCost = useMemo(() => {
    if (EXTREME_REGIONS.includes(form.region)) return SHIPPING_COST_EXTREME;
    if (form.region === "Región Metropolitana") return SHIPPING_COST_RM;
    return SHIPPING_COST_REGIONS;
  }, [form.region]);

  const discount = couponApplied ? couponDiscount : 0;
  const finalTotal = totalPrice + shippingCost - discount;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleApplyCoupon = async () => {
    const code = coupon.trim();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const result = await validateCoupon(code, totalPrice);
      setCouponDiscount(result.discount);
      setCouponApplied(true);
      addToast(`Cupón ${result.code} aplicado: ${result.type === 'percentage' ? `${result.value}%` : `$${result.value.toLocaleString()}`} de descuento`, "success");
    } catch {
      setCouponError("Cupón inválido o expirado");
      setCouponApplied(false);
      setCouponDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: FieldErrors = {};

    if (!form.name.trim() || form.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
    }
    if (!form.email.trim() || !validateEmail(form.email.trim())) {
      newErrors.email = "Ingresa un email válido";
    }
    if (form.phone.trim() && !/^(\+?56)?\s?9\s?\d{4}\s?\d{4}$/.test(form.phone.trim().replace(/\s/g, ''))) {
      newErrors.phone = "Ingresa un teléfono chileno válido (ej: +56 9 1234 5678)";
    }
    if (!form.address.trim() || form.address.trim().length < 10) {
      newErrors.address = "La dirección debe tener al menos 10 caracteres";
    }
    if (!form.comuna.trim()) {
      newErrors.comuna = "Ingresa tu comuna";
    }
    if (!form.zip.trim() || !validateZip(form.zip.trim())) {
      newErrors.zip = "El código postal debe tener entre 4 y 8 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else {
      if (submitting) return;
      setSubmitting(true);

      try {
        const result = await createPaymentPreference({
          shipping_name: form.name,
          shipping_email: form.email,
          shipping_phone: form.phone || undefined,
          shipping_address: form.address,
          shipping_city: form.comuna,
          shipping_zip: form.zip,
          shipping_region: form.region,
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
          })),
          coupon: couponApplied ? coupon.trim() : undefined,
          user_id: user?.id || null,
        });

        addToast("Redirigiendo a MercadoPago para completar el pago...", "info");

        // Limpiar carrito antes de redirigir
        clearCart();

        // Guardar email en sessionStorage para el success callback
        sessionStorage.setItem("checkout-email", form.email);

        // Redirigir al checkout de MercadoPago
        window.location.href = result.init_point;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error al procesar el pago";

        // ── Manejar productos no encontrados en BD ──
        // Si un producto en el carrito ya no existe en la BD (porque se eliminó o cambió el ID),
        // lo removemos automáticamente del carrito para que el usuario pueda reintentar
        const notFoundMatch = msg.match(/Producto no encontrado: (.+)/);
        const outOfStockMatch = msg.match(/Producto agotado: (.+)/);
        const insufficientStockMatch = msg.match(/Stock insuficiente para: ([^(]+)/);
        
        if (notFoundMatch) {
          const missingId = notFoundMatch[1];
          const missingItem = items.find((i) => i.product.id === missingId);
          const productName = missingItem?.product.name || missingId;
          removeItem(missingId);
          addToast(`"${productName}" ya no está disponible. Se removió de tu carrito.`, "error");
          setStep(1);
        } else if (outOfStockMatch) {
          const productName = outOfStockMatch[1].trim();
          const outOfStockItem = items.find((i) => i.product.name === productName);
          if (outOfStockItem) {
            removeItem(outOfStockItem.product.id);
            addToast(`"${productName}" se agotó mientras comprabas. Se removió de tu carrito.`, "error");
            setStep(1);
          } else {
            addToast(msg, "error");
          }
        } else if (insufficientStockMatch) {
          const productName = insufficientStockMatch[1].trim();
          const stockItem = items.find((i) => i.product.name === productName);
          if (stockItem) {
            removeItem(stockItem.product.id);
            addToast(`"${productName}" no tiene stock suficiente. Se removió de tu carrito.`, "error");
            setStep(1);
          } else {
            addToast(msg, "error");
          }
        } else {
          addToast(msg, "error");
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Mostrar status de MercadoPago si hay query params
  const showMpStatus = statusParam === "failure" || statusParam === "pending";

  if (items.length === 0 && !showMpStatus) {
    return (
      <div className="page page-checkout animate-in">
        <div className="cart-empty">
          <div className="empty-icon">
            <ShoppingBag size={36} />
          </div>
          <h2>No hay productos en tu carrito</h2>
          <p>Agrega productos antes de proceder al pago.</p>
          <Link to="/productos" className="btn btn-primary">
            <ShoppingBag size={16} />
            Ir a la tienda
          </Link>
        </div>
      </div>
    );
  }

  if (showMpStatus) {
    const isError = statusParam === "failure";
    return (
      <div className="page page-checkout animate-in">
        <div className="checkout-confirmation" style={{ textAlign: "center", padding: "3rem 1rem" }}>
          {isError ? (
            <>
              <div style={{ background: "#fef2f2", color: "#dc2626", width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
              <h2>Pago no completado</h2>
              <p>El pago fue rechazado o cancelado. Puedes intentar de nuevo.</p>
              <Link to="/cart" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                Volver al carrito
              </Link>
            </>
          ) : (
            <>
              <div style={{ background: "#fefce8", color: "#ca8a04", width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h2>Pago pendiente</h2>
              <p>Tu pago está siendo procesado. Te notificaremos cuando se confirme.</p>
              <Link to="/order-status" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                Ver estado del pedido
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page page-checkout animate-in">
      <h2>Checkout</h2>

      <div className="checkout-steps">
        <div className={`step-item ${step >= 1 ? "active" : ""}`}>
          <div className="step-circle">
            {step > 1 ? <CheckCircle size={18} /> : <MapPin size={18} />}
          </div>
          <span className="step-label">Envío</span>
        </div>
        <div className={`step-line ${step >= 2 ? "active" : ""}`} />
        <div className={`step-item ${step >= 2 ? "active" : ""}`}>
          <div className="step-circle">
            {step > 2 ? <CheckCircle size={18} /> : <CreditCard size={18} />}
          </div>
          <span className="step-label">Pago</span>
        </div>
        <div className={`step-line ${step >= 3 ? "active" : ""}`} />
        <div className={`step-item ${step >= 3 ? "active" : ""}`}>
          <div className="step-circle">
            <CheckCircle size={18} />
          </div>
          <span className="step-label">Confirmado</span>
        </div>
      </div>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit} noValidate>
          {step === 1 && (
            <>
              <h3>Dirección de envío</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Nombre completo</label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Tu nombre"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={errors.name ? "input-error-border" : ""}
                  />
                  {errors.name && <span className="input-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="tu@email.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={errors.email ? "input-error-border" : ""}
                  />
                  {errors.email && <span className="input-error">{errors.email}</span>}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="phone">Teléfono <span style={{color:"var(--text-secondary)",fontWeight:400}}>(opcional)</span></label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="+56 9 1234 5678"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={errors.phone ? "input-error-border" : ""}
                />
                {errors.phone && <span className="input-error">{errors.phone}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="address">Dirección</label>
                <input
                  type="text"
                  id="address"
                  placeholder="Calle y número, depto (opcional)"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className={errors.address ? "input-error-border" : ""}
                />
                {errors.address && <span className="input-error">{errors.address}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="region">Región</label>
                  <select
                    id="region"
                    value={form.region}
                    onChange={(e) => handleChange("region", e.target.value)}
                  >
                    {CHILEAN_REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="comuna">Comuna</label>
                  <input
                    type="text"
                    id="comuna"
                    placeholder="Ej: Providencia"
                    value={form.comuna}
                    onChange={(e) => handleChange("comuna", e.target.value)}
                    className={errors.comuna ? "input-error-border" : ""}
                  />
                  {errors.comuna && <span className="input-error">{errors.comuna}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="zip">Código postal</label>
                  <input
                    type="text"
                    id="zip"
                    placeholder="12345"
                    value={form.zip}
                    onChange={(e) => handleChange("zip", e.target.value)}
                    className={errors.zip ? "input-error-border" : ""}
                  />
                  {errors.zip && <span className="input-error">{errors.zip}</span>}
                </div>
              </div>

              <div className="checkout-coupon">
                <h4>Cupón de descuento</h4>
                <div className="coupon-row">
                  <input
                    type="text"
                    placeholder="Ingresa tu cupón"
                    value={coupon}
                    onChange={(e) => { setCoupon(e.target.value); setCouponError(""); }}
                    disabled={couponApplied}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleApplyCoupon}
                    disabled={couponApplied || !coupon.trim() || couponLoading}
                  >
                    {couponLoading ? <Loader size={14} className="spin" /> : <Tag size={14} />}
                    {couponLoading ? "..." : couponApplied ? "Aplicado" : "Aplicar"}
                  </button>
                </div>
                {couponError && <span className="input-error">{couponError}</span>}
                {couponApplied && (
                  <span style={{ fontSize: "0.78rem", color: "var(--success)", fontWeight: 600 }}>
                    -${couponDiscount.toLocaleString()}
                  </span>
                )}
                <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  ¿Tienes un cupón? Ingresa el código aquí.
                </p>
              </div>

              <div className="checkout-trust-note">
                <Shield size={14} />
                <span>Tus datos están seguros con nosotros</span>
              </div>

              <button type="submit" className="btn btn-primary">
                Continuar al pago
                <ArrowRight size={16} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h3>Método de pago</h3>

              <div className="checkout-mp-payment">
                <div className="mp-payment-card">
                  <div className="mp-payment-logo">
                    <CreditCard size={32} />
                  </div>
                  <h4>Mercado Pago — Checkout Pro</h4>
                  <p>Serás redirigido a Mercado Pago para completar el pago de forma segura.</p>
                  <p className="mp-payment-note">
                    Aceptamos tarjetas de crédito, débito y efectivo (RedCompra, Prepago).
                  </p>
                  <div className="mp-payment-features">
                    <div className="mp-feature">
                      <Shield size={14} />
                      <span>Pago 100% seguro</span>
                    </div>
                    <div className="mp-feature">
                      <CheckCircle size={14} />
                      <span>Procesado por Mercado Pago</span>
                    </div>
                    <div className="mp-feature">
                      <MapPin size={14} />
                      <span>Sin compartir datos bancarios con la tienda</span>
                    </div>
                  </div>
                </div>

                <div className="checkout-summary-mini">
                  <div className="summary-row">
                    <span>Subtotal ({totalItems} {totalItems === 1 ? 'ítem' : 'ítems'})</span>
                    <span>${totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span>Envío {form.region !== 'Región Metropolitana' ? `(${form.region})` : ''}</span>
                    <span>{shippingCost === 0 ? 'Gratis' : `$${shippingCost.toLocaleString()}`}</span>
                  </div>
                  {discount > 0 && (
                    <div className="summary-row" style={{ color: 'var(--success)' }}>
                      <span>Descuento</span>
                      <span>-${discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="summary-row summary-total">
                    <span>Total a pagar</span>
                    <span>${finalTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="checkout-actions">
                <button type="button" className="btn btn-outline" onClick={() => setStep(1)} disabled={submitting}>
                  <ArrowLeft size={16} />
                  Volver
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><Loader size={16} className="spin" /> Procesando...</>
                  ) : (
                    <><CreditCard size={16} /> Pagar con Mercado Pago</>
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="checkout-summary">
          <h3>Tu pedido</h3>
          <div className="checkout-items">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="checkout-item">
                <div className="checkout-item-image" style={{ background: product.gradient }}>
                  <img src={product.images[0]} alt={product.name} className="checkout-item-img" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
                <div className="checkout-item-info">
                  <div className="checkout-item-category">
                    {categoryIconsSmall[product.category] || <Sparkles size={10} />}
                    <span>{product.category}</span>
                  </div>
                  <span className="checkout-item-name">{product.name}</span>
                  <span className="checkout-item-qty">x{quantity}</span>
                </div>
                <span className="checkout-item-price">${(product.price * quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="checkout-total-rows">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${totalPrice.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Envío {form.region !== "Región Metropolitana" ? `(${form.region})` : ""}</span>
              <span>{shippingCost === 0 ? "Gratis" : `$${shippingCost.toLocaleString()}`}</span>
            </div>
            {discount > 0 && (
              <div className="summary-row" style={{ color: "var(--success)" }}>
                <span>Descuento (10%)</span>
                <span>-${discount.toLocaleString()}</span>
              </div>
            )}
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>${finalTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
