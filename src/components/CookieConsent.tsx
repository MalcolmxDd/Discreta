import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "discretastore-cookies";

type CookieChoice = "all" | "essential" | null;

function loadChoice(): CookieChoice {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "all" || raw === "essential") return raw;
    return null;
  } catch {
    return null;
  }
}

function saveChoice(choice: CookieChoice) {
  if (choice) {
    localStorage.setItem(STORAGE_KEY, choice);
  }
}

export default function CookieConsent() {
  const [choice, setChoice] = useState<CookieChoice>(loadChoice);
  const [visible, setVisible] = useState(false);

  // Pequeño delay para animación de entrada
  useEffect(() => {
    if (choice === null) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [choice]);

  const acceptAll = () => {
    saveChoice("all");
    setChoice("all");
  };

  const acceptEssential = () => {
    saveChoice("essential");
    setChoice("essential");
  };

  if (choice !== null || !visible) return null;

  return (
    <div className="cookie-consent-overlay" role="dialog" aria-label="Consentimiento de cookies">
      <div className="cookie-consent-banner">
        <div className="cookie-consent-icon">
          <Cookie size={20} />
        </div>
        <div className="cookie-consent-text">
          <p>
            Utilizamos cookies esenciales para el funcionamiento del sitio
            (carrito, sesión, preferencias). También usamos cookies analíticas
            anónimas para mejorar tu experiencia.
          </p>
          <p className="cookie-consent-meta">
            Puedes elegir{" "}
            <Link to="/privacidad" className="cookie-consent-link">
              qué cookies aceptar
            </Link>
            . Más información en nuestra{" "}
            <Link to="/privacidad" className="cookie-consent-link">
              Política de Privacidad
            </Link>
            .
          </p>
        </div>
        <div className="cookie-consent-actions">
          <button
            className="btn btn-sm btn-outline"
            onClick={acceptEssential}
            aria-label="Solo cookies esenciales"
          >
            Solo esenciales
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={acceptAll}
            aria-label="Aceptar todas las cookies"
          >
            Aceptar todas
          </button>
        </div>
        <button
          className="cookie-consent-close"
          onClick={acceptEssential}
          aria-label="Cerrar y aceptar solo esenciales"
          title="Aceptar solo esenciales"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
