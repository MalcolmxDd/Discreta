import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit2, Trash2, Package, Search } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useAdmin } from "../../context/AdminContext";
import { categoryIcons } from "../../data/categories";

export default function ProductsPage() {
  usePageMeta("Productos — Admin");
  const { products, categories, deleteProduct } = useAdmin();
  const [search, setSearch] = useState("");

  const getCategoryName = (catId: string) =>
    categories.find((c) => c.id === catId)?.name || catId;

  const filtered = search
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        getCategoryName(p.category).toLowerCase().includes(search.toLowerCase())
      )
    : products;

  return (
    <div className="page animate-in">
      <div className="admin-page-header">
        <h2>Productos</h2>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div className="form-group" style={{ margin: 0, minWidth: 180, flex: 1 }}>
            <div className="input-with-icon">
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="admin-search-input"
              />
            </div>
          </div>
          <Link to="/admin/productos/nuevo" className="btn btn-primary" style={{ flexShrink: 0 }}>
            <Plus size={16} />
            Nuevo
          </Link>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Categoría</th>
              <th>Rating</th>
              <th>Destacado</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="admin-thumb" style={{ background: p.gradient }}>
                    <img src={p.images[0]} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                </td>
                <td className="admin-table-name">{p.name}</td>
                <td>${p.price.toLocaleString()}</td>
                <td>
                  <span className="admin-cat-badge">
                    {categoryIcons[p.category]}
                    {getCategoryName(p.category)}
                  </span>
                </td>
                <td>{p.rating} ★</td>
                <td>
                  <span className={`admin-badge ${p.isFeatured ? "admin-badge-ok" : "admin-badge-no"}`}>
                    {p.isFeatured ? "Sí" : "No"}
                  </span>
                </td>
                <td>
                  {p.stockCount > 0 && p.stockCount <= 5 ? (
                    <span className="admin-badge" style={{ background: "#fff3cd", color: "#856404" }}>
                      {p.stockCount} uds.
                    </span>
                  ) : (
                    <span className={`admin-badge ${p.inStock ? "admin-badge-ok" : "admin-badge-no"}`}>
                      {p.inStock ? `${p.stockCount} uds.` : "Agotado"}
                    </span>
                  )}
                </td>
                <td>
                  <div className="admin-actions">
                    <Link to={`/admin/productos/${p.id}/editar`} className="admin-action-btn" title="Editar">
                      <Edit2 size={14} />
                    </Link>
                    <button
                      className="admin-action-btn danger"
                      onClick={() => { if (confirm(`¿Eliminar "${p.name}"?`)) deleteProduct(p.id); }}
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="page-empty" style={{ minHeight: "20vh", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "4rem 0" }}>
          <Package size={32} className="empty-icon" />
          <p>{search ? "No se encontraron productos con ese término." : "No hay productos todavía. Crea el primero."}</p>
          {!search && (
            <Link to="/admin/productos/nuevo" className="btn btn-primary">
              <Plus size={16} />
              Nuevo Producto
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
