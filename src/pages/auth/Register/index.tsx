import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, UserPlus, User, Eye, EyeOff, Check, X } from "lucide-react";
import { usePageMeta } from "../../../hooks/usePageMeta";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

function passwordStrength(pwd: string): { label: string; score: number; checks: { min: boolean; upper: boolean; digit: boolean; length: boolean } } {
  const checks = {
    min: pwd.length >= 6,
    upper: /[A-Z]/.test(pwd),
    digit: /\d/.test(pwd),
    length: pwd.length >= 8,
  };
  const score = [checks.min, checks.upper, checks.digit, checks.length].filter(Boolean).length;
  const labels = ["", "Débil", "Regular", "Buena", "Fuerte"];
  return { label: labels[score], score, checks };
}

export default function Register() {
  usePageMeta("Crear Cuenta", "Crea tu cuenta en DiscretaStore para guardar tus favoritos y agilizar tus compras.");
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const prefillEmail = urlParams.get("email") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const strength = passwordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }
    if (!email.trim()) {
      setError("Ingresa tu email");
      return;
    }
    if (!password) {
      setError("Ingresa una contraseña");
      return;
    }
    if (!strength.checks.min) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!acceptTerms) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    setLoading(true);
    register(name, email, password).then((result) => {
      setLoading(false);
      if (result.success) {
        addToast("Cuenta creada con éxito. ¡Bienvenido!", "success");
        navigate("/");
      } else {
        setError(result.error || "Error al crear la cuenta");
      }
    });
  };

  const CheckIcon = ({ ok }: { ok: boolean }) =>
    ok ? <Check size={12} color="var(--success)" /> : <X size={12} color="var(--text-secondary)" />;

  return (
    <div className="page page-auth animate-in">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-icon">
            <UserPlus size={24} />
          </div>
          <h2>Crear Cuenta</h2>
          <p className="auth-subtitle">Únete a DiscretaStore</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-name">Nombre</label>
            <div className="input-with-icon">
              <User size={16} />
              <input
                type="text"
                id="reg-name"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                autoFocus
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                type="email"
                id="reg-email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">Contraseña</label>
            <div className="input-with-icon">
              <Lock size={16} />
              <input
                type={showPass ? "text" : "password"}
                id="reg-password"
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
            {password && (
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.35rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 600, color: strength.score >= 3 ? "var(--success)" : strength.score >= 2 ? "var(--accent)" : "var(--text-secondary)" }}>
                  {strength.label}
                </span>
                <span style={{ display: "flex", gap: "0.35rem", alignItems: "center", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  <CheckIcon ok={strength.checks.length} /> 6+ chars
                </span>
                <span style={{ display: "flex", gap: "0.35rem", alignItems: "center", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  <CheckIcon ok={strength.checks.upper} /> Mayúscula
                </span>
                <span style={{ display: "flex", gap: "0.35rem", alignItems: "center", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  <CheckIcon ok={strength.checks.digit} /> Número
                </span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="reg-confirm">Confirmar contraseña</label>
            <div className="input-with-icon">
              <Lock size={16} />
              <input
                type={showPass ? "text" : "password"}
                id="reg-confirm"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
              />
            </div>
          </div>
          <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              id="reg-terms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              style={{ width: "auto", accentColor: "var(--accent)" }}
            />
            <label htmlFor="reg-terms" style={{ fontSize: "0.75rem", textTransform: "none", letterSpacing: "normal", cursor: "pointer" }}>
              Acepto los <Link to="/terminos" style={{ textDecoration: "underline" }}>términos y condiciones</Link>
            </label>
          </div>
          {error && <span className="input-error" style={{ display: "block" }}>{error}</span>}
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <UserPlus size={16} />
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
