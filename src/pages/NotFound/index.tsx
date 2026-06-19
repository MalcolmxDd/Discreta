import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";

export default function NotFound() {
  usePageMeta("Página no encontrada");

  return (
    <div className="page page-not-found animate-in">
      <h2>404</h2>
      <p>Esta página no existe.</p>
      <Link to="/" className="btn btn-primary">Volver al inicio</Link>
    </div>
  );
}
