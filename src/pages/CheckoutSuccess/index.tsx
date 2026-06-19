import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Package, Truck, UserPlus, ArrowRight, Loader, AlertCircle } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { confirmPayment } from "../../api/mercadoPago";

export default function CheckoutSuccess() {
  usePageMeta("Pago Exitoso");
  const { isAuthenticated } = useAuth();
  const { clearCart } = useCart();
  const { addToast } = useToast();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const orderId = searchParams.get("order_id");
  const paymentId = searchParams.get("payment_id") || searchParams.get("collection_id");
  const statusParam = searchParams.get("status");
  const savedEmail = sessionStorage.getItem("checkout-email") || searchParams.get("email") || "";

  // Confirmar el pago en el backend (respaldo por si el webhook no llegó)
  useEffect(() => {
    let mounted = true;

    async function confirmOrder() {
      if (!orderId && !paymentId) {
        if (mounted) {
          setProcessing(false);
        }
        return;
      }

      try {
        const result = await confirmPayment({
          order_id: orderId || undefined,
          payment_id: paymentId || undefined,
        });

        if (!mounted) return;

        if (result.processed) {
          setConfirmed(true);
          addToast("¡Pedido confirmado! Recibirás un email con los detalles.", "success");
        } else if (result.status === "confirmed") {
          // Ya estaba confirmado (por webhook)
          setConfirmed(true);
        } else {
          // No se pudo confirmar (pendiente, o no encontrado)
          setConfirmError(result.message || "No se pudo confirmar el pedido.");
        }
      } catch (err) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : "Error al confirmar el pago";
        setConfirmError(msg);
      } finally {
        if (mounted) {
          setProcessing(false);
        }
      }
    }

    // Solo procesar si status=approved (viene de MP)
    if (statusParam === "approved") {
      confirmOrder();
    } else {
      setProcessing(false);
    }

    // Limpiar carrito al llegar a esta página
    clearCart();
    sessionStorage.removeItem("checkout-email");

    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page page-checkout animate-in">
      <div className="checkout-confirmation">
        {processing ? (
          <>
            <div style={{ background: "var(--accent-bg, #fce4ec)", color: "var(--accent, #e94e8a)", width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <Loader size={48} className="spin" />
            </div>
            <h2>Confirmando tu pedido...</h2>
            <p>Estamos procesando tu pago. Esto tomará solo unos segundos.</p>
          </>
        ) : confirmError ? (
          <>
            <div style={{ background: "#fef2f2", color: "#dc2626", width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <AlertCircle size={48} />
            </div>
            <h2>Pago recibido, pero con advertencia</h2>
            <p>Tu pago fue procesado por MercadoPago, pero hubo un problema al confirmar el pedido: {confirmError}</p>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              No te preocupes — si el pago fue exitoso, tu pedido está siendo procesado. Si no recibes un email de confirmación en los próximos minutos, contáctanos.
            </p>
            {orderId && (
              <p style={{ fontSize: "0.85rem", fontFamily: "monospace", margin: "0.5rem 0" }}>
                Pedido #{orderId.slice(0, 8).toUpperCase()}
              </p>
            )}
            <Link to="/order-status" className="btn btn-primary" style={{ marginTop: "1rem" }}>
              Ver estado del pedido
            </Link>
          </>
        ) : (
          <>
            <div className="checkout-check-icon" style={{ background: "var(--success-bg, #e8f5e9)", color: "var(--success, #2e7d32)" }}>
              <CheckCircle size={48} />
            </div>
            <h2>¡Pago exitoso!</h2>
            {orderId && (
              <p className="checkout-order-id">
                Pedido #{orderId.slice(0, 8).toUpperCase()}
              </p>
            )}
            <p>
              {confirmed
                ? "Tu pedido ha sido confirmado. Recibirás un email con los detalles y el seguimiento."
                : "Recibirás un email con los detalles de tu compra y el seguimiento."}
            </p>
            <div className="confirm-details">
              <div className="confirm-item">
                <Package size={14} />
                <span>Envío discreto garantizado</span>
              </div>
              <div className="confirm-item">
                <Truck size={14} />
                <span>Tracking disponible por email</span>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="checkout-guest-convert" style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--bg)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <UserPlus size={16} style={{ color: "var(--accent)" }} />
                  <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>¿Quieres guardar tus datos?</span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                  Crea una cuenta y podrás ver tu historial de pedidos, guardar favoritos y comprar más rápido la próxima vez.
                </p>
                <Link to={`/register?email=${encodeURIComponent(savedEmail)}`} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>
                  <UserPlus size={14} />
                  Crear cuenta
                </Link>
              </div>
            )}

            <Link to="/productos" className="btn btn-primary" style={{ marginTop: "1rem" }}>
              <ArrowRight size={14} />
              Seguir explorando
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
