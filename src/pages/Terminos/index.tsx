import { FileText, ShieldCheck, DollarSign, Package, Copyright } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";

export default function Terminos() {
  usePageMeta("Términos y Condiciones", "Al usar DiscretaStore aceptas estos términos. Léelos con calma.");

  return (
    <div className="page page-info animate-in">
      <div className="info-hero">
        <span className="hero-accent" />
        <h2>Términos y Condiciones</h2>
        <p className="info-lead">
          Al usar DiscretaStore aceptas estos términos. Léelos con calma.
        </p>
      </div>

      <div className="info-content">
        <div className="info-card">
          <span className="info-card-icon"><FileText size={20} /></span>
          <h3>1. Uso del Sitio</h3>
          <p>
            Al acceder y utilizar este sitio web, aceptas cumplir con estos
            términos. Si no estás de acuerdo, por favor no uses nuestros servicios.
            Nos reservamos el derecho de actualizar estos términos en cualquier
            momento; los cambios serán publicados en esta página.
          </p>
        </div>
        <div className="info-card">
          <span className="info-card-icon"><ShieldCheck size={20} /></span>
          <h3>2. Edad Mínima</h3>
          <p>
            Para realizar compras en DiscretaStore debes ser mayor de 18 años.
            Al completar una orden, declaras y garantizas cumplir con este
            requisito. Nos reservamos el derecho de solicitar verificación de edad.
          </p>
        </div>
        <div className="info-card">
          <span className="info-card-icon"><DollarSign size={20} /></span>
          <h3>3. Precios y Pagos</h3>
          <p>
            Todos los precios están expresados en pesos chilenos ($ CLP) e
            incluyen IVA. Nos reservamos el derecho de modificar precios sin
            aviso previo, aunque los cambios no afectarán órdenes ya confirmadas.
          </p>
        </div>
        <div className="info-card">
          <span className="info-card-icon"><Package size={20} /></span>
          <h3>4. Disponibilidad</h3>
          <p>
            Todos los productos están sujetos a disponibilidad de stock. Si un
            producto no está disponible después de realizar tu pedido, te
            notificaremos y reembolsaremos el monto correspondiente.
          </p>
        </div>
        <div className="info-card">
          <span className="info-card-icon"><Copyright size={20} /></span>
          <h3>5. Propiedad Intelectual</h3>
          <p>
            Todo el contenido del sitio —incluyendo textos, imágenes, logos y
            diseño— es propiedad de DiscretaStore. No está permitida su
            reproducción sin autorización expresa.
          </p>
        </div>
      </div>
    </div>
  );
}
