import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send, CheckCircle, Loader } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { request } from "../../api/client";

export default function ForgotPassword() {
  usePageMeta("Recuperar Contraseña", "Recupera el acceso a tu cuenta de DiscretaStore.");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresa un email válido");
      return;
    }

    setLoading(true);
    try {
      await request("/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim() },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar solicitud");
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="page page-auth animate-in">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-icon" style={{ background: "var(--success-bg)" }}>
              <CheckCircle size={24} color="var(--success)" />
            </div>
            <h2>Revisa tu email</h2>
            <p className="auth-subtitle">
              Si existe una cuenta asociada a <strong>{email}</strong>, recibirás instrucciones para restablecer tu contraseña.
            </p>
          </div>
          <Link to="/login" className="btn btn-outline btn-block" style={{ marginTop: "1rem" }}>
            <ArrowLeft size={16} />
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-auth animate-in">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon">
            <Mail size={24} />
          </div>
          <h2>Recuperar Contraseña</h2>
          <p className="auth-subtitle">Te enviaremos un link para restablecer tu contraseña</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reset-email">Email</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                type="email"
                id="reset-email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                autoFocus
              />
            </div>
            {error && <span className="input-error">{error}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Loader size={16} className="spin" /> : <Send size={16} />}
            {loading ? "Enviando..." : "Enviar instrucciones"}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/login"><ArrowLeft size={14} /> Volver a inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}
