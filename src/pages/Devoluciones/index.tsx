import { Shield, AlertCircle, RotateCcw } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";

export default function Devoluciones() {
  usePageMeta("Devoluciones y Cambios", "Queremos que estés 100% conforme. Conoce nuestras condiciones y proceso.");

  return (
    <div className="page page-info animate-in">
      <div className="info-hero">
        <span className="hero-accent" />
        <h2>Devoluciones y Cambios</h2>
        <p className="info-lead">
          Queremos que estés 100% conforme. Si algo no funciona, lo solucionamos.
        </p>
      </div>

      <div className="info-content">
        <div className="info-card">
          <span className="info-card-icon"><Shield size={20} /></span>
          <h3>Garantía de 30 Días</h3>
          <p>
            Si recibes un producto con falla de fábrica, lo reemplazamos sin costo.
            Contáctanos dentro de los primeros 30 días desde la recepción y te
            gestionamos el cambio.
          </p>
        </div>

        <div className="info-card">
          <span className="info-card-icon"><AlertCircle size={20} /></span>
          <h3>Condiciones</h3>
          <ul className="info-list">
            <li>El producto debe estar sin uso y en su empaque original.</li>
            <li>Por higiene, no aceptamos devoluciones de productos que hayan sido abiertos o usados.</li>
            <li>Los lubricantes y aceites no tienen cambio una vez sellado roto.</li>
            <li>Los gastos de envío de devolución corren por cuenta del cliente, excepto en fallas de fábrica.</li>
          </ul>
        </div>

        <div className="info-card">
          <span className="info-card-icon"><RotateCcw size={20} /></span>
          <h3>¿Cómo gestionar una devolución?</h3>
          <ol className="info-list info-list-num">
            <li>Escríbenos a <strong>hola@discretastore.cl</strong> con tu número de pedido.</li>
            <li>Te enviaremos las instrucciones y la etiqueta si aplica.</li>
            <li>Una vez recibido el producto, procesamos el reembolso o cambio en un máximo de 5 días hábiles.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
