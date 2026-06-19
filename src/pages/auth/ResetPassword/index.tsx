import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, CheckCircle, Loader, Eye, EyeOff } from "lucide-react";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { request } from "../../../api/client";

export default function ResetPassword() {
  usePageMeta("Nueva Contraseña");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Debe contener al menos una mayúscula");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Debe contener al menos un número");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!token || !email) {
      setError("Link inválido o expirado. Solicita un nuevo restablecimiento.");
      return;
    }

    setLoading(true);
    try {
      await request("/auth/reset-password", {
        method: "POST",
        body: { token, email, password },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al restablecer contraseña");
    }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="page page-auth animate-in">
        <div className="auth-card">
          <div className="auth-card-header">
            <div className="auth-icon" style={{ background: "var(--success-bg)" }}>
              <CheckCircle size={24} color="var(--success)" />
            </div>
            <h2>Contraseña actualizada</h2>
            <p className="auth-subtitle">Tu contraseña se ha restablecido exitosamente.</p>
          </div>
          <button className="btn btn-primary btn-block" onClick={() => navigate("/login")}>
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-auth animate-in">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon">
            <Lock size={24} />
          </div>
          <h2>Nueva Contraseña</h2>
          <p className="auth-subtitle">Ingresa tu nueva contraseña</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reset-pw">Nueva contraseña</label>
            <div className="input-with-icon">
              <Lock size={16} />
              <input
                type={showPw ? "text" : "password"}
                id="reset-pw"
                placeholder="Mín. 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <button type="button" className="input-suffix-btn" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="reset-confirm">Confirmar contraseña</label>
            <input
              type={showPw ? "text" : "password"}
              id="reset-confirm"
              placeholder="Repite la contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <span className="input-error">{error}</span>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: "0.75rem" }}>
            {loading ? <Loader size={16} className="spin" /> : null}
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
        <p className="auth-footer">
          <Link to="/login"><ArrowLeft size={14} /> Volver a inicio de sesión</Link>
        </p>
      </div>
    </div>
  );
}
