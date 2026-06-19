import { useState, useEffect, useCallback } from "react";
import { Search, Package, ChevronDown, AlertCircle, Check } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useAdmin } from "../../context/AdminContext";
import { useToast } from "../../context/ToastContext";
import { request } from "../../api/client";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  user_id: string | null;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  shipping_name: string;
  shipping_email: string;
  total: number;
  created_at: string;
  items: OrderItem[];
}

const statusFlow: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "admin-badge-no" },
  confirmed: { label: "Confirmado", className: "admin-badge-ok" },
  shipped: { label: "Enviado", className: "admin-badge-warn" },
  delivered: { label: "Entregado", className: "admin-badge-ok" },
  cancelled: { label: "Cancelado", className: "" },
};

export default function OrdersPage() {
  usePageMeta("Pedidos — Admin");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { isAdmin } = useAdmin();
  const { addToast } = useToast();

  const fetchOrders = useCallback(() => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    request<Order[]>('/admin/orders')
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cargar pedidos');
        setLoading(false);
      });
  }, [isAdmin]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      await request('/admin/orders', {
        method: 'PATCH',
        body: { order_id: orderId, status: newStatus },
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o))
      );
      addToast(`Pedido ${orderId.slice(0, 8)}... → ${statusConfig[newStatus]?.label || newStatus}`, "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Error al actualizar estado', "error");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.id.toLowerCase().includes(q) ||
        (o.shipping_name || '').toLowerCase().includes(q) ||
        (o.shipping_email || '').toLowerCase().includes(q);
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  if (loading) {
    return (
      <div className="page animate-in">
        <div className="admin-page-header"><h2>Pedidos</h2></div>
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>
          Cargando pedidos...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page animate-in">
        <div className="admin-page-header"><h2>Pedidos</h2></div>
        <div className="page-empty" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <AlertCircle size={32} className="empty-icon" />
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page animate-in">
      <div className="admin-page-header">
        <h2>Pedidos</h2>
        <p className="page-subtitle">{orders.length} pedidos registrados</p>
      </div>

      <div className="admin-filters">
        <div className="form-group" style={{ flex: 1 }}>
          <label htmlFor="order-search">Buscar</label>
          <div className="input-with-icon">
            <Search size={16} />
            <input
              type="text"
              id="order-search"
              placeholder="Buscar por ID, cliente o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.2rem" }}
            />
          </div>
        </div>
      </div>

      <div className="admin-filter-pills">
        {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => {
          const label = s === "all" ? "Todas" : statusConfig[s]?.label || s;
          return (
            <button
              key={s}
              className={`filter-chip ${filter === s ? "active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="page-empty" style={{ minHeight: "20vh", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "4rem 2rem", textAlign: "center" }}>
          <Package size={32} className="empty-icon" />
          <p>No se encontraron pedidos con ese filtro.</p>
        </div>
      ) : (
        <div className="order-cards">
          {filtered.map((order) => {
            const cfg = statusConfig[order.status];
            const isExpanded = expanded === order.id;
            const nextStatuses = statusFlow[order.status] || [];
            return (
              <div key={order.id} className="order-status-card">
                <div className="order-status-card-header" style={{ marginBottom: 0, paddingBottom: isExpanded ? "0.75rem" : 0, cursor: "pointer" }}
                  onClick={() => setExpanded(isExpanded ? null : order.id)}>
                  <div>
                    <span className="order-status-id">{order.id}</span>
                    <span className={`admin-badge ${cfg?.className || "admin-badge-ok"}`}>{cfg?.label || order.status}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span className="order-status-date">{formatDate(order.created_at)}</span>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>${order.total.toLocaleString()}</span>
                    <ChevronDown
                      size={16}
                      style={{
                        transition: "transform 0.3s",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        color: "var(--text-secondary)",
                      }}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                    <div className="order-detail-grid">
                      <div>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.68rem", textTransform: "uppercase", fontWeight: 600 }}>Cliente</span>
                        <p style={{ fontWeight: 600, marginTop: "2px" }}>{order.shipping_name}</p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>{order.shipping_email}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.68rem", textTransform: "uppercase", fontWeight: 600 }}>Total</span>
                        <p style={{ fontWeight: 700, fontSize: "1rem", marginTop: "2px" }}>${order.total.toLocaleString()}</p>
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>Productos</span>
                      {order.items.map((item, i) => (
                        <div key={i} className="order-status-item" style={{ marginTop: "0.4rem" }}>
                          <span className="order-status-item-name">{item.name}</span>
                          <span className="order-status-item-qty">x{item.quantity}</span>
                          <span className="order-status-item-price">${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    {nextStatuses.length > 0 && (
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.05em" }}>Actualizar estado</span>
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                          {nextStatuses.map((ns) => (
                            <button
                              key={ns}
                              className="btn btn-sm"
                              style={{
                                background: ns === "cancelled" ? "var(--error)" : "var(--accent)",
                                color: "#fff",
                                border: "none",
                                opacity: updating === order.id ? 0.6 : 1,
                              }}
                              onClick={() => updateStatus(order.id, ns)}
                              disabled={updating === order.id}
                            >
                              {updating === order.id ? "..." : <><Check size={12} /> {statusConfig[ns]?.label || ns}</>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
