import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchProductBySlug } from "../api/products";

interface BreadcrumbSegment {
  label: string;
  path: string;
}

const labelMap: Record<string, string> = {
  "": "Inicio",
  productos: "Productos",
  cart: "Carrito",
  checkout: "Checkout",
  wishlist: "Favoritos",
  about: "Nosotros",
  contact: "Contacto",
  envios: "Envíos",
  devoluciones: "Devoluciones",
  faq: "FAQ",
  terminos: "Términos",
  privacidad: "Privacidad",
  login: "Iniciar Sesión",
  register: "Crear Cuenta",
  "order-status": "Estado de Pedido",
  "forgot-password": "Recuperar Contraseña",
  account: "Mi Cuenta",
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const [productName, setProductName] = useState<string | null>(null);

  const segments = pathname.split("/").filter(Boolean);

  // Look up product name from API if on product detail
  const productosIdx = segments.indexOf("productos");
  const isProductDetail = productosIdx !== -1 && segments.length === productosIdx + 2;
  const slug = isProductDetail ? segments[productosIdx + 1] : null;

  useEffect(() => {
    if (slug) {
      fetchProductBySlug(slug)
        .then((p) => setProductName(p.name))
        .catch(() => setProductName(null));
    } else {
      setProductName(null);
    }
  }, [slug]);

  // Skip breadcrumbs on home and admin (después de todos los hooks)
  if (pathname === "/" || pathname.startsWith("/admin")) return null;

  let accumulated = "";
  const crumbs: BreadcrumbSegment[] = segments.map((segment) => {
    accumulated += `/${segment}`;
    let label = labelMap[segment] || decodeURIComponent(segment);

    if (isProductDetail && segment === slug) {
      label = productName || decodeURIComponent(segment);
    }

    return { label, path: accumulated };
  });

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link to="/" className="breadcrumb-link">Inicio</Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="breadcrumb-item">
          <span className="breadcrumb-sep" aria-hidden="true">›</span>
          {i === crumbs.length - 1 ? (
            <span className="breadcrumb-current" aria-current="page">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="breadcrumb-link">{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
