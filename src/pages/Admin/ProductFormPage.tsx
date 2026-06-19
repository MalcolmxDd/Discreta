import { useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Upload, X, Plus, RefreshCw } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useAdmin, generateId } from "../../context/AdminContext";
import { uploadImage, deleteImage, validateImage } from "../../api/upload";
import { useToast } from "../../context/ToastContext";

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, categories, addProduct, updateProduct } = useAdmin();
  const { addToast } = useToast();

  const existing = id ? products.find((p) => p.id === id) : undefined;
  const isEditing = !!existing;
  usePageMeta(isEditing ? "Editar Producto — Admin" : "Nuevo Producto — Admin");

  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const replaceSingleInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  const [form, setForm] = useState({
    id: existing?.id || "",
    name: existing?.name || "",
    slug: existing?.slug || "",
    description: existing?.description || "",
    longDescription: existing?.longDescription || "",
    price: existing?.price?.toString() || "",
    originalPrice: existing?.originalPrice?.toString() || "",
    images: existing?.images?.length ? existing.images : [],
    category: existing?.category || (categories[0]?.id || ""),
    tags: existing?.tags?.join(", ") || "",
    inStock: existing?.inStock ?? true,
    stockCount: existing?.stockCount?.toString() || "10",
    features: existing?.features?.join("\n") || "",
    isFeatured: existing?.isFeatured ?? false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  /** Sube archivos y los AGREGA al final sin borrar las actuales */
  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const urls = await uploadFiles(e);
    if (!urls) return;
    setForm((prev) => ({ ...prev, images: [...prev.images.filter(Boolean), ...urls] }));
    addToast(`${urls.length} imagen(es) agregada(s)`, "success");
  };

  /** Sube un archivo y REEMPLAZA la imagen en el índice indicado */
  const handleReplaceSingle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const urls = await uploadFiles(e);
    if (!urls || replacingIndex === null) return;
    // Reemplazar solo la imagen en esa posición
    setForm((prev) => {
      const newImages = [...prev.images.filter(Boolean)];
      if (replacingIndex < newImages.length) {
        newImages[replacingIndex] = urls[0];
      } else {
        newImages.push(urls[0]);
      }
      return { ...prev, images: newImages };
    });
    setReplacingIndex(null);
    addToast(`Imagen reemplazada`, "success");
  };

  /** Lógica compartida: valida, sube archivos y retorna URLs. Resetea el input. */
  const uploadFiles = async (e: React.ChangeEvent<HTMLInputElement>): Promise<string[] | null> => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return null;

    for (const file of files) {
      const error = validateImage(file);
      if (error) {
        addToast(`${file.name}: ${error}`, "error");
        resetInputs();
        return null;
      }
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const result = await uploadImage(file);
        uploadedUrls.push(result.url);
      } catch (err) {
        addToast(`Error al subir ${file.name}: ${err instanceof Error ? err.message : "Error desconocido"}`, "error");
      }
    }

    setUploading(false);
    resetInputs();
    return uploadedUrls.length > 0 ? uploadedUrls : null;
  };

  const resetInputs = useCallback(() => {
    if (addMoreInputRef.current) addMoreInputRef.current.value = "";
    if (replaceSingleInputRef.current) replaceSingleInputRef.current.value = "";
  }, []);

  /** Elimina del form y también del servidor */
  const handleRemoveImage = async (index: number, url: string) => {
    // Eliminar del servidor (best effort — si falla, igual se quita del form)
    try {
      await deleteImage(url);
    } catch {
      // Si la imagen no está en nuestro servidor o falla, no bloqueamos
    }
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseInt(form.price, 10);
    if (!form.name || !price) return;

    const allImages = form.images.filter(Boolean);
    const productData = {
      id: isEditing ? form.id : generateId(form.slug || form.name.toLowerCase().replace(/\s+/g, "-"), products),
      name: form.name.trim(),
      slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, "-"),
      description: form.description.trim(),
      longDescription: form.longDescription.trim(),
      price,
      originalPrice: form.originalPrice ? parseInt(form.originalPrice, 10) : undefined,
      images: allImages.length > 0 ? allImages : [`https://picsum.photos/seed/${Date.now()}/400/400`],
      gradient: "linear-gradient(135deg, #1a1a2e, #0f3460)",
      category: form.category,
      stockCount: parseInt(form.stockCount, 10) || 0,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      rating: existing ? existing.rating : 0,
      inStock: form.inStock,
      features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
      isFeatured: form.isFeatured,
    };

    try {
      if (isEditing) {
        await updateProduct(id!, productData);
        addToast("Producto actualizado exitosamente", "success");
      } else {
        await addProduct(productData);
        addToast("Producto creado exitosamente", "success");
      }
      navigate("/admin/productos");
    } catch (err) {
      addToast(
        `Error al ${isEditing ? "actualizar" : "crear"} producto: ${err instanceof Error ? err.message : "Error desconocido"}`,
        "error"
      );
    }
  };

  return (
    <div className="page animate-in">
      <div className="admin-page-header">
        <h2>{isEditing ? "Editar Producto" : "Nuevo Producto"}</h2>
        <Link to="/admin/productos" className="btn btn-outline">
          <ArrowLeft size={14} />
          Volver
        </Link>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          {/* ===== IMÁGENES MÚLTIPLES ===== */}
          <div className="form-group form-group-full">
            <label>Imágenes del producto</label>
            <div className="upload-area">
              {/* Grid de imágenes subidas */}
              {form.images.filter(Boolean).length > 0 && (
                <div className="upload-grid">
                  {form.images.filter(Boolean).map((url, i) => (
                    <div key={i} className={`upload-grid-item ${url === form.images[0] ? 'is-main' : ''}`}>
                      <img
                        src={url}
                        alt={`Imagen ${i + 1}`}
                        className="upload-grid-img"
                        onClick={() => {
                          setForm((prev) => {
                            if (prev.images[0] === url) return prev;
                            const filtered = prev.images.filter((u) => u !== url);
                            return { ...prev, images: [url, ...filtered] };
                          });
                        }}
                        title={url === form.images[0] ? 'Imagen principal' : 'Click para establecer como principal'}
                      />
                      {/* Overlay de acciones hover */}
                      <div className="upload-item-actions">
                        <button
                          type="button"
                          className="upload-action-btn upload-replace-btn"
                          onClick={() => {
                            setReplacingIndex(i);
                            replaceSingleInputRef.current?.click();
                          }}
                          title="Reemplazar esta imagen"
                        >
                          <RefreshCw size={12} />
                        </button>
                        <button
                          type="button"
                          className="upload-action-btn upload-remove-btn"
                          onClick={() => handleRemoveImage(i, url)}
                          title="Eliminar imagen"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      {url === form.images[0] && <span className="upload-main-badge">Principal</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Botón de agregar imágenes */}
              <div
                className="upload-placeholder upload-add-more"
                onClick={() => addMoreInputRef.current?.click()}
              >
                {uploading ? (
                  <>
                    <Upload size={24} className="upload-spinner" />
                    <p>Subiendo imágenes...</p>
                  </>
                ) : (
                  <>
                    <Plus size={24} />
                    <p>Agregar imágenes</p>
                    <span className="upload-hint">Las nuevas imágenes se agregan al final. Podés eliminar las que no quieras con la X. JPG, PNG, WebP — Máx 5MB c/u</span>
                  </>
                )}
              </div>
              <span className="upload-hint" style={{ fontSize: '0.7rem', opacity: 0.5 }}>Click en una imagen para establecerla como principal.</span>

              {/* Input oculto */}
              <input
                ref={addMoreInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleUploadImages}
                style={{ display: "none" }}
              />
              <input
                ref={replaceSingleInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleReplaceSingle}
                style={{ display: "none" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">Nombre *</label>
            <input type="text" id="name" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="slug">Slug (URL)</label>
            <input type="text" id="slug" name="slug" value={form.slug} onChange={handleChange} placeholder="auto si se deja vacío" />
          </div>
          <div className="form-group">
            <label htmlFor="category">Categoría *</label>
            <select id="category" name="category" value={form.category} onChange={handleChange}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="price">Precio ($) *</label>
            <input type="number" id="price" name="price" value={form.price} onChange={handleChange} min="0" required />
          </div>
          <div className="form-group">
            <label htmlFor="originalPrice">Precio original ($)</label>
            <input type="number" id="originalPrice" name="originalPrice" value={form.originalPrice} onChange={handleChange} min="0" placeholder="opcional, para mostrar descuento" />
          </div>
          <div className="form-group">
            <label htmlFor="stockCount">Stock disponible</label>
            <input type="number" id="stockCount" name="stockCount" value={form.stockCount} onChange={handleChange} min="0" />
          </div>
          <div className="form-group form-group-check">
            <label>
              <input type="checkbox" name="inStock" checked={form.inStock} onChange={handleChange} />
              En stock
            </label>
          </div>
          <div className="form-group form-group-check">
            <label>
              <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
              Destacado (aparece en Home)
            </label>
          </div>
          <div className="form-group form-group-full">
            <label htmlFor="description">Descripción corta</label>
            <input type="text" id="description" name="description" value={form.description} onChange={handleChange} />
          </div>
          <div className="form-group form-group-full">
            <label htmlFor="longDescription">Descripción larga</label>
            <textarea id="longDescription" name="longDescription" value={form.longDescription} onChange={handleChange} rows={3} />
          </div>
          <div className="form-group form-group-full">
            <label htmlFor="tags">Tags (separados por coma)</label>
            <input type="text" id="tags" name="tags" value={form.tags} onChange={handleChange} />
          </div>
          <div className="form-group form-group-full">
            <label htmlFor="features">Características (una por línea)</label>
            <textarea id="features" name="features" value={form.features} onChange={handleChange} rows={4} />
          </div>
        </div>

        <div className="admin-form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading}
          >
            {uploading ? (
              <>Subiendo imágenes...</>
            ) : (
              <>
                <Save size={16} />
                {isEditing ? "Guardar cambios" : "Crear producto"}
              </>
            )}
          </button>
          <Link to="/admin/productos" className="btn btn-outline">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
