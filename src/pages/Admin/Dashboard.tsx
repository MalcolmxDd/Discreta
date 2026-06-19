import { LayoutDashboard, Package, Star, Percent, AlertTriangle, XCircle, DollarSign, Wrench, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useAdmin } from "../../context/AdminContext";
import { useToast } from "../../context/ToastContext";
import { request } from "../../api/client";

export default function Dashboard() {
  usePageMeta("Dashboard — Admin");
  const { stats, products, refresh } = useAdmin();
  const { addToast } = useToast();
  const [maintLoading, setMaintLoading] = useState(false);

  const featuredCount = products.filter((p) => p.rating >= 4.5).length;
  const withDiscount = products.filter((p) => p.originalPrice).length;

  const handleToggleMaintenance = async () => {
    setMaintLoading(true);
    try {
      const res = await request<{ maintenance: boolean }>("/admin/maintenance", { method: "POST" });
      addToast(res.maintenance ? "Modo mantenimiento activado" : "Tienda activada", "success");
      refresh();
    } catch {
      addToast("Error al cambiar modo mantenimiento", "error");
    }
    setMaintLoading(false);
  };

  const cards = [
    { icon: Package, value: stats.totalProducts, label: "Productos", color: true },
    { icon: LayoutDashboard, value: stats.totalCategories, label: "Categorías", color: true },
    { icon: DollarSign, value: `$${stats.avgPrice.toLocaleString()}`, label: "Precio promedio", color: true },
    { icon: Star, value: featuredCount, label: "Destacados", color: true },
    { icon: Percent, value: withDiscount, label: "Con descuento", color: true },
    { icon: AlertTriangle, value: stats.lowStock, label: "Stock bajo", color: false },
    { icon: XCircle, value: stats.outOfStock, label: "Agotados", color: false },
  ];

  return (
    <div className="page animate-in">
      <div className="admin-page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="page-subtitle">Resumen de tu tienda</p>
        </div>
        <Link to="/" className="btn btn-outline" style={{ fontSize: "0.82rem", flexShrink: 0 }}>
          <ArrowLeft size={14} />
          Volver a la tienda
        </Link>
      </div>

      <div className="admin-stats-grid">
        {cards.map((card, i) => (
          <div key={i} className="admin-stat-card">
            <span className="admin-stat-icon">
              <card.icon size={20} />
            </span>
            <span className="admin-stat-value">{card.value}</span>
            <span className="admin-stat-label">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <h3>Mantenimiento</h3>
        <div className="admin-stat-card" style={{ cursor: "pointer", userSelect: "none" }} onClick={handleToggleMaintenance}>
          <span className="admin-stat-icon">
            <Wrench size={20} />
          </span>
          <span className="admin-stat-value">{stats.maintenance ? "Activado" : "Desactivado"}</span>
          <span className="admin-stat-label">
            {maintLoading ? "..." : stats.maintenance ? "Desactivar mantenimiento" : "Activar mantenimiento"}
          </span>
        </div>
      </div>

      <div className="admin-section">
        <h3>Productos recientes</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Categoría</th>
                <th>Rating</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(-5).reverse().map((p) => (
                <tr key={p.id}>
                  <td className="admin-table-name">{p.name}</td>
                  <td>${p.price.toLocaleString()}</td>
                  <td>{p.category}</td>
                  <td>{p.rating} ★</td>
                  <td>
                    <span className={`admin-badge ${p.inStock ? "admin-badge-ok" : "admin-badge-no"}`}>
                      {p.inStock ? "En stock" : "Agotado"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
