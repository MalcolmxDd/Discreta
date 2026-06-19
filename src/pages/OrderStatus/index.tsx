import { useState } from "react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { request } from "../../api/client";

interface OrderItem {
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  line_total: number;
}

interface TrackedOrder {
  id: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_name: string;
  shipping_email: string;
  created_at: string;
  items: OrderItem[];
}

const statusStyles: Record<string, string> = {
  pending: "admin-badge-no",
  confirmed: "admin-badge-ok",
  shipped: "admin-badge-ok",
  delivered: "admin-badge-ok",
  cancelled: "",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  shipped: "En tránsito",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export default function OrderStatus() {
  usePageMeta("Estado de Pedido", "Consulta el estado de tus pedidos ingresando tu email.");

  const [email, setEmail] = useState("");
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);

    try {
      const data = await request<TrackedOrder[]>(`/orders/track?email=${encodeURIComponent(trimmed)}`);
      setOrders(Array.isArray(data) && data.length > 0 ? data : []);
      setSearched(true);
    } catch {
      setOrders([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-order-status animate-in">
      <div className="info-hero">
        <span className="hero-accent" />
        <h2>Estado de tu Pedido</h2>
        <p className="info-lead">
          Ingresa tu email para consultar el estado de tus compras.
        </p>
      </div>

      <div className="order-status-search">
        <form onSubmit={handleSearch} className="order-status-form">
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="os-email">Email usado al comprar</label>
            <input
              type="email"
              id="os-email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: "1.4rem" }}>
            Buscar
          </button>
        </form>
      </div>

      {searched && (
        <div className="order-status-results">
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
              Buscando pedidos...
            </div>
          ) : orders === null || orders.length === 0 ? (
            <div className="order-status-empty">
              <p>No encontramos pedidos asociados a <strong>{email}</strong>.</p>
              <p className="order-status-hint">
                ¿Usaste otro email? Revisa la bandeja de entrada de tu correo para confirmar la dirección que ingresaste.
              </p>
            </div>
          ) : (
            <>
              <p className="order-status-count">
                {orders.length} {orders.length === 1 ? "pedido encontrado" : "pedidos encontrados"}
              </p>
              <div className="order-status-list">
                {orders.map((order) => {
                  const label = statusLabels[order.status] || order.status;
                  const style = statusStyles[order.status] || "admin-badge-ok";
                  const date = new Date(order.created_at).toLocaleDateString('es-CL', {
                    year: 'numeric', month: '2-digit', day: '2-digit'
                  });
                  return (
                    <div key={order.id} className="order-status-card">
                      <div className="order-status-card-header">
                        <div>
                          <span className="order-status-id">{order.id.slice(0, 8).toUpperCase()}</span>
                          <span className={`admin-badge ${style}`}>
                            {label}
                          </span>
                        </div>
                        <span className="order-status-date">{date}</span>
                      </div>
                      <div className="order-status-items">
                        {order.items.map((item, i) => (
                          <div key={i} className="order-status-item">
                            <span className="order-status-item-name">{item.product_name}</span>
                            <span className="order-status-item-qty">x{item.quantity}</span>
                            <span className="order-status-item-price">${item.line_total.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="order-status-total">
                        <span>Total</span>
                        <span>${order.total.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {!searched && (
        <div className="order-status-info">
          <div className="info-card">
            <h3>¿Cómo funciona?</h3>
            <p>
              Ingresa el mismo email que usaste al momento de la compra y podrás ver
              el estado actual de todos tus pedidos. No necesitas tener una cuenta.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
