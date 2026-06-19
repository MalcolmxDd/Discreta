import { useState } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useAdmin, generateId } from "../../context/AdminContext";
import type { Category } from "../../types";

export default function CategoriesPage() {
  usePageMeta("Categorías — Admin");
  const { categories, addCategory, updateCategory, deleteCategory } = useAdmin();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [showNew, setShowNew] = useState(false);

  const resetForm = () => setForm({ name: "", slug: "", description: "" });

  const handleNew = () => {
    if (!form.name.trim()) return;
    const id = generateId(form.slug || form.name.toLowerCase().replace(/\s+/g, "-"), categories);
    addCategory({
      id,
      name: form.name.trim(),
      slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, "-"),
      description: form.description.trim(),
    });
    resetForm();
    setShowNew(false);
  };

  const handleEdit = (c: Category) => {
    if (!form.name.trim()) return;
    updateCategory(c.id, {
      name: form.name.trim(),
      slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, "-"),
      description: form.description.trim(),
    });
    resetForm();
    setEditingId(null);
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({ name: c.name, slug: c.slug, description: c.description });
    setShowNew(false);
  };

  return (
    <div className="page animate-in">
      <div className="admin-page-header">
        <h2>Categorías</h2>
        <button className="btn btn-primary" onClick={() => { setShowNew(!showNew); setEditingId(null); resetForm(); }}>
          <Plus size={16} />
          {showNew ? "Cancelar" : "Nueva"}
        </button>
      </div>

      {showNew && (
        <div className="admin-inline-form">
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Vibradores" />
          </div>
          <div className="form-group">
            <label>Slug</label>
            <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto si se deja vacío" />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={handleNew}>
            <Save size={14} />
            Crear
          </button>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Slug</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                {editingId === c.id ? (
                  <>
                    <td className="admin-table-id">{c.id}</td>
                    <td><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></td>
                    <td><input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></td>
                    <td><input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-action-btn" onClick={() => handleEdit(c)} title="Guardar"><Save size={14} /></button>
                        <button className="admin-action-btn danger" onClick={() => { setEditingId(null); resetForm(); }} title="Cancelar"><X size={14} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="admin-table-id">{c.id}</td>
                    <td className="admin-table-name">{c.name}</td>
                    <td>{c.slug}</td>
                    <td>{c.description}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-action-btn" onClick={() => startEdit(c)} title="Editar"><Edit2 size={14} /></button>
                        <button className="admin-action-btn danger" onClick={() => { if (confirm(`¿Eliminar categoría "${c.name}"?`)) deleteCategory(c.id); }} title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
