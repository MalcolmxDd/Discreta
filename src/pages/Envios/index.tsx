import { Package, Truck, MapPin, Search } from "lucide-react";
import { FREE_SHIPPING_RM, FREE_SHIPPING_REGIONS, SHIPPING_COST_EXTREME } from "../../constants";
import { usePageMeta } from "../../hooks/usePageMeta";

export default function Envios() {
  usePageMeta("Envíos", "Todo viaja con la misma discreción con la que tú eliges. Conoce nuestros plazos y cobertura.");

  return (
    <div className="page page-info animate-in">
      <div className="info-hero">
        <span className="hero-accent" />
        <h2>Envíos</h2>
        <p className="info-lead">
          Todo viaja con la misma discreción con la que tú eliges.
        </p>
      </div>

      <div className="info-content">
        <div className="info-card">
          <span className="info-card-icon"><Package size={20} /></span>
          <h3>Embalaje Discreto</h3>
          <p>
            Todos los pedidos se envían en una caja opaca sin logotipos, sellos ni
            cualquier indicación del contenido. En la franquicia postal aparece
            <strong> "DS Express"</strong> como remitente. Nadie sabrá qué hay dentro.
          </p>
        </div>

        <div className="info-card">
          <span className="info-card-icon"><MapPin size={20} /></span>
          <h3>Cobertura y Plazos</h3>
          <div className="info-table-wrap">
            <table className="info-table">
              <thead>
                <tr>
                  <th>Destino</th>
                  <th>Plazo estimado</th>
                  <th>Costo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Santiago (RM)</td>
                  <td>1 — 2 días hábiles</td>
                  <td>Gratis sobre ${FREE_SHIPPING_RM.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Regiones</td>
                  <td>3 — 5 días hábiles</td>
                  <td>Gratis sobre ${FREE_SHIPPING_REGIONS.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Zonas extremas</td>
                  <td>5 — 8 días hábiles</td>
                  <td>${SHIPPING_COST_EXTREME.toLocaleString()} fijo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="info-card">
          <span className="info-card-icon"><Search size={20} /></span>
          <h3>Seguimiento</h3>
          <p>
            Una vez despachado, recibirás un email con tu número de tracking.
            También puedes consultar el estado de tu pedido en nuestra
            página de seguimiento con el mismo email que usaste al comprar.
          </p>
        </div>

        <div className="info-card">
          <span className="info-card-icon"><Truck size={20} /></span>
          <h3>Envio sin mínimo</h3>
          <p>
            Hacemos envíos a todo Chile, sin monto mínimo de compra. El costo
            de envío se calcula al momento del pago según tu destino.
          </p>
        </div>
      </div>
    </div>
  );
}
