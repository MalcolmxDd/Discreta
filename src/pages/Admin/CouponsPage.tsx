import { useState, useEffect } from "react";
import { Tag, Plus, Trash2, Percent, DollarSign, Calendar, Power } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { fetchCoupons, createCoupon, updateCoupon, deleteCoupon, type Coupon } from "../../api/coupons";
import { useToast } from "../../context/ToastContext";

export default function CouponsPage() {
  usePageMeta("Cupones — Admin");
  const { addToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: "",
    min_amount: "",
    max_uses: "",
    expires_at: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      setCoupons(await fetchCoupons());
    } catch {
      addToast("Error al cargar cupones", "error");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCoupon({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        min_amount: form.min_amount ? Number(form.min_amount) : null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at || null,
      });
      addToast("Cupón creado", "success");
      setShowForm(false);
      setForm({ code: "", type: "percentage", value: "", min_amount: "", max_uses: "", expires_at: "" });
      load();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Error al crear cupón", "error");
    }
  };

  const handleToggle = async (c: Coupon) => {
    try {
      await updateCoupon({ id: c.id, is_active: c.is_active ? 0 : 1 });
      addToast(c.is_active ? "Cupón desactivado" : "Cupón activado", "success");
      load();
    } catch {
      addToast("Error al actualizar cupón", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este cupón?")) return;
    try {
      await deleteCoupon(id);
      addToast("Cupón eliminado", "success");
      load();
    } catch {
      addToast("Error al eliminar cupón", "error");
    }
  };

  const formatExpiry = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-CL");
  };

  return (
    <div className="page animate-in">
      <div className="admin-page-header">
        <h2>Cupones</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} />
          {showForm ? "Cancelar" : "Nuevo cupón"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="admin-form" style={{ marginBottom: "1.5rem" }}>
          <div className="form-row">
            <div className="form-group">
              <label>Código</label>
              <input type="text" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="EJ: VERANO20" />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percentage" | "fixed" })}>
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
            </div>
            <div className="form-group">
              <label>{form.type === "percentage" ? "Porcentaje" : "Monto"}</label>
              <input type="number" required min={1} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Monto mínimo (opcional)</label>
              <input type="number" min={0} value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })} placeholder="Ej: 15000" />
            </div>
            <div className="form-group">
              <label>Usos máximos (opcional)</label>
              <input type="number" min={1} value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Ej: 50" />
            </div>
            <div className="form-group">
              <label>Vence (opcional)</label>
              <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Crear cupón</button>
        </form>
      )}

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Cargando...</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Usos</th>
                <th>Vence</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.code}</strong></td>
                  <td>
                    <span className="admin-cat-badge">
                      {c.type === "percentage" ? <Percent size={12} /> : <DollarSign size={12} />}
                      {c.type === "percentage" ? "%" : "$"}
                    </span>
                  </td>
                  <td>{c.type === "percentage" ? `${c.value}%` : `$${c.value.toLocaleString()}`}</td>
                  <td>{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                  <td><Calendar size={12} /> {formatExpiry(c.expires_at)}</td>
                  <td>
                    <span className={`admin-badge ${c.is_active ? "admin-badge-ok" : "admin-badge-no"}`}>
                      {c.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-action-btn" onClick={() => handleToggle(c)} title={c.is_active ? "Desactivar" : "Activar"}>
                        <Power size={14} />
                      </button>
                      <button className="admin-action-btn danger" onClick={() => handleDelete(c.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && coupons.length === 0 && (
        <div className="page-empty" style={{ padding: "4rem 0", textAlign: "center" }}>
          <Tag size={32} className="empty-icon" />
          <p>No hay cupones todavía.</p>
        </div>
      )}
    </div>
  );
}
