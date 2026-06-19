import { Database, Eye, Shield, FileCheck, Cookie } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";

export default function Privacidad() {
  usePageMeta("Política de Privacidad", "Tu privacidad es tan importante para nosotros como para ti.");

  return (
    <div className="page page-info animate-in">
      <div className="info-hero">
        <span className="hero-accent" />
        <h2>Política de Privacidad</h2>
        <p className="info-lead">
          Tu privacidad es tan importante para nosotros como para ti.
        </p>
      </div>

      <div className="info-content">
        <div className="info-card">
          <span className="info-card-icon"><Database size={20} /></span>
          <h3>1. Datos que Recopilamos</h3>
          <p>
            Recopilamos la información que nos proporcionas al comprar o
            registrarte: nombre, email, dirección de envío y datos de pago
            (procesados de forma segura por MercadoPago). También recopilamos
            datos de navegación anónimos para mejorar tu experiencia.
          </p>
        </div>
        <div className="info-card">
          <span className="info-card-icon"><Eye size={20} /></span>
          <h3>2. Uso de la Información</h3>
          <p>
            Usamos tus datos para procesar pedidos, enviar confirmaciones,
            mejorar nuestro servicio y, con tu consentimiento, enviarte ofertas
            y novedades. Nunca compartimos tu información con terceros.
          </p>
        </div>
        <div className="info-card">
          <span className="info-card-icon"><Shield size={20} /></span>
          <h3>3. Seguridad</h3>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas para
            proteger tus datos personales. Toda la información sensible se
            transmite mediante cifrado SSL y se almacena de forma segura.
          </p>
        </div>
        <div className="info-card">
          <span className="info-card-icon"><FileCheck size={20} /></span>
          <h3>4. Tus Derechos</h3>
          <p>
            Puedes solicitar en cualquier momento acceder, rectificar o eliminar
            tus datos personales escribiéndonos a hola@discretastore.cl.
            También puedes darte de baja de nuestros correos promocionales con
            un clic en el enlace de cada email.
          </p>
        </div>
        <div className="info-card">
          <span className="info-card-icon"><Cookie size={20} /></span>
          <h3>5. Cookies</h3>
          <p>
            Utilizamos cookies esenciales para el funcionamiento del sitio
            (carrito de compras, sesión). No usamos cookies de rastreo
            publicitario sin tu consentimiento explícito.
          </p>
        </div>
      </div>
    </div>
  );
}
