import { useState } from "react";
import { Mail, Heart, Clock, Send, CheckCircle } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useToast } from "../../context/ToastContext";

const CONTACTS_KEY = "discretastore-contacts";

export default function Contact() {
  usePageMeta("Contacto", "Dudas, sugerencias, lo que sea. Estamos aquí para ti.");
  const { addToast } = useToast();

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      addToast("Completa todos los campos", "error");
      return;
    }

    // Save to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem(CONTACTS_KEY) || "[]");
      existing.push({
        ...form,
        date: new Date().toISOString(),
        id: `contact-${Date.now()}`,
      });
      localStorage.setItem(CONTACTS_KEY, JSON.stringify(existing));
    } catch { /* storage full */ }

    setForm({ name: "", email: "", message: "" });
    setSent(true);
    addToast("Mensaje enviado. Te responderemos pronto.", "success");
  };

  return (
    <div className="page page-contact animate-in">
      <div className="contact-hero">
        <span className="hero-accent" />
        <h2>Hablemos</h2>
        <p className="contact-lead">Dudas, sugerencias, lo que sea. Estamos aquí para ti.</p>
      </div>

      <div className="contact-layout">
        <div className="contact-card">
          {sent ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "3rem 1rem", textAlign: "center" }}>
              <CheckCircle size={48} style={{ color: "var(--success)" }} />
              <h3>¡Mensaje enviado!</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Gracias por escribirnos. Te responderemos a la brevedad.
              </p>
              <button className="btn btn-outline" onClick={() => setSent(false)}>
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Nombre</label>
                <input
                  type="text"
                  id="name"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="message">Mensaje</label>
                <textarea
                  id="message"
                  placeholder="¿En qué podemos ayudarte?"
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                <Send size={16} />
                Enviar mensaje
              </button>
            </form>
          )}
        </div>

        <div className="contact-info">
          <div className="contact-item">
            <span className="contact-item-icon"><Mail size={18} /></span>
            <div>
              <h4>Email</h4>
              <p>contacto@discretasex.cl</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-item-icon"><Heart size={18} /></span>
            <div>
              <h4>Redes</h4>
              <p>@discretastore</p>
            </div>
          </div>
          <div className="contact-item">
            <span className="contact-item-icon"><Clock size={18} /></span>
            <div>
              <h4>Horario</h4>
              <p>Lun — Vie, 10:00 — 19:00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
