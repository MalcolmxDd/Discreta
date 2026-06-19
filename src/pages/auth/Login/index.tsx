import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { useAuth } from "../../../context/AuthContext";

export default function Login() {
  usePageMeta("Iniciar Sesión", "Accede a tu cuenta de DiscretaStore para ver tus pedidos y favoritos.");
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Ingresa tu email");
      return;
    }
    if (!password) {
      setError("Ingresa tu contraseña");
      return;
    }

    setLoading(true);
    login(email, password).then((result) => {
      setLoading(false);
      if (result.success) {
        navigate("/");
      } else {
        setError(result.error || "Error al iniciar sesión");
      }
    });
  };

  return (
    <div className="page page-auth animate-in">
      <Link to="/" className="back-link" style={{ marginBottom: "1rem", display: "inline-flex" }}>
        <ArrowLeft size={16} />
        Volver al inicio
      </Link>
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon">
            <LogIn size={24} />
          </div>
          <h2>Iniciar Sesión</h2>
          <p className="auth-subtitle">Bienvenido de vuelta</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                type="email"
                id="login-email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                autoFocus
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Contraseña</label>
            <div className="input-with-icon">
              <Lock size={16} />
              <input
                type={showPass ? "text" : "password"}
                id="login-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
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
          </div>
          {error && <span className="input-error" style={{ display: "block", marginTop: "-0.5rem" }}>{error}</span>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <LogIn size={16} />
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
        <p style={{ textAlign: "center", fontSize: "0.75rem", marginTop: "0.5rem" }}>
          <Link to="/forgot-password" style={{ color: "var(--text-secondary)", textDecoration: "underline" }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </div>
    </div>
  );
}
