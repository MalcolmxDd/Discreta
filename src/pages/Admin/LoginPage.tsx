import { useState } from "react";
import { Lock, LogIn, Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import { Navigate, Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useAdmin } from "../../context/AdminContext";
import { useAuth } from "../../context/AuthContext";

export default function AdminLoginPage() {
  usePageMeta("Acceso Admin");
  const { isAdmin, login } = useAdmin();
  const { loginAsAdmin } = useAuth();
  const [email, setEmail] = useState("admin@discretastore.cl");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await loginAsAdmin(email, password);
    if (result.success) {
      const adminOk = await login();
      if (!adminOk) setError("Error de permisos de administrador");
    } else {
      setError(result.error || "Error al iniciar sesión");
    }
    setLoading(false);
  };

  return (
    <div className="page page-auth animate-in">
      <Link to="/" className="back-link" style={{ marginBottom: "1rem", display: "inline-flex" }}>
        <ArrowLeft size={16} />
        Volver a la tienda
      </Link>
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon">
            <Lock size={24} />
          </div>
          <h2>Acceso Admin</h2>
          <p className="auth-subtitle">Inicia sesión con tu cuenta de administrador</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="admin-email">Email</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                type="email"
                id="admin-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@discretastore.cl"
                autoFocus
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="admin-pass">Contraseña</label>
            <div className="input-with-icon">
              <Lock size={16} />
              <input
                type={showPass ? "text" : "password"}
                id="admin-pass"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••"
              />
              <button
                type="button"
                className="input-toggle-pass"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? "Ocultar" : "Mostrar"}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <span className="input-error">{error}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <LogIn size={16} />
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <Link to="/login" style={{ fontSize: "0.8rem", display: "block", textAlign: "center", marginTop: "0.5rem" }}>
          ¿No eres admin? Inicia sesión como usuario
        </Link>
      </div>
    </div>
  );
}
