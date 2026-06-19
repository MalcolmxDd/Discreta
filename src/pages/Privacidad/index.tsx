import { Database, Shield, Cookie, ScrollText, ShieldAlert, ListChecks, UserCheck, Scale, Mail } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";

export default function Privacidad() {
  usePageMeta(
    "Política de Privacidad — DiscretaStore",
    "Conoce cómo protegemos tus datos personales en cumplimiento de la Ley 21.719 sobre Protección de Datos Personales. Tus derechos ARCO-PB, datos sensibles y más."
  );

  return (
    <div className="page page-info animate-in">
      <div className="info-hero">
        <span className="hero-accent" />
        <h2>Política de Privacidad</h2>
        <p className="info-lead">
          Tu privacidad es tan importante para nosotros como para ti. Esta
          política se rige por la <strong>Ley N° 21.719</strong> sobre
          Protección de los Datos Personales (que modifica la Ley N° 19.628).
        </p>
      </div>

      <div className="info-content">
        {/* 1. Datos que Recopilamos */}
        <div className="info-card">
          <span className="info-card-icon"><Database size={20} /></span>
          <h3>1. Datos que Recopilamos</h3>
          <p>
            Recopilamos la información que nos proporcionas voluntariamente al
            comprar o registrarte:
          </p>
          <ul className="info-list">
            <li>
              <strong>Datos de identificación y contacto:</strong> nombre
              completo, correo electrónico, teléfono.
            </li>
            <li>
              <strong>Datos de envío:</strong> dirección, ciudad, región,
              código postal.
            </li>
            <li>
              <strong>Datos de pago:</strong> procesados de forma segura y
              directa por MercadoPago — nosotros no almacenamos números de
              tarjeta ni datos financieros sensibles.
            </li>
            <li>
              <strong>Datos de navegación:</strong> dirección IP, tipo de
              navegador, páginas visitadas, con fines analíticos anónimos para
              mejorar tu experiencia.
            </li>
            <li>
              <strong>Historial de compras:</strong> productos adquiridos,
              fechas, montos, para gestión de pedidos y atención al cliente.
            </li>
          </ul>
        </div>

        {/* 2. Base Legal */}
        <div className="info-card">
          <span className="info-card-icon"><ScrollText size={20} /></span>
          <h3>2. Base Legal del Tratamiento</h3>
          <p>
            El tratamiento de tus datos personales tiene las siguientes bases
            legales, conforme a la Ley N° 21.719:
          </p>
          <ul className="info-list info-list-num">
            <li>
              <strong>Ejecución de un contrato:</strong> para procesar tus
              pedidos, gestionar pagos y coordinar envíos.
            </li>
            <li>
              <strong>Consentimiento explícito:</strong> para el envío de
              comunicaciones promocionales y para el tratamiento de datos
              sensibles cuando corresponda.
            </li>
            <li>
              <strong>Interés legítimo:</strong> para mejorar nuestros
              servicios, prevenir fraudes y garantizar la seguridad del sitio.
            </li>
            <li>
              <strong>Obligación legal:</strong> para cumplir con
              requerimientos tributarios, aduaneros y regulatorios aplicables.
            </li>
          </ul>
        </div>

        {/* 3. Datos Sensibles */}
        <div className="info-card">
          <span className="info-card-icon"><ShieldAlert size={20} /></span>
          <h3>3. Datos Sensibles</h3>
          <p>
            De acuerdo con la Ley N° 21.719, se consideran{" "}
            <strong>datos personales sensibles</strong> aquellos que revelan
            información sobre la vida sexual, orientación sexual e identidad de
            género, entre otros. Dada la naturaleza de nuestra tienda,
            reconocemos que los productos que comercializamos pueden estar
            vinculados a estas categorías.
          </p>
          <p>
            Por esta razón:
          </p>
          <ul className="info-list">
            <li>
              Toda la información sobre tus compras se trata con la{" "}
              <strong>máxima confidencialidad y discreción</strong>.
            </li>
            <li>
              Los envíos se realizan en empaques completamente neutros, sin
              identificación del remitente ni del contenido.
            </li>
            <li>
              No asociamos tus preferencias de compra a perfiles públicos ni
              compartimos esta información con terceros.
            </li>
            <li>
              El tratamiento de estos datos se basa en tu{" "}
              <strong>consentimiento explícito</strong>, el cual puedes
              revocar en cualquier momento.
            </li>
          </ul>
        </div>

        {/* 4. Tus Derechos ARCO-PB */}
        <div className="info-card">
          <span className="info-card-icon"><ListChecks size={20} /></span>
          <h3>4. Tus Derechos ARCO-PB</h3>
          <p>
            La Ley N° 21.719 te otorga los siguientes derechos, que puedes
            ejercer de forma gratuita y sin restricciones:
          </p>
          <div className="info-table-wrap">
            <table className="info-table">
              <thead>
                <tr>
                  <th>Sigla</th>
                  <th>Derecho</th>
                  <th>¿En qué consiste?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>A</strong></td>
                  <td><strong>Acceso</strong></td>
                  <td>
                    Solicitar confirmación sobre si estamos tratando tus datos
                    personales y acceder a ellos.
                  </td>
                </tr>
                <tr>
                  <td><strong>R</strong></td>
                  <td><strong>Rectificación</strong></td>
                  <td>
                    Solicitar que modifiquemos o completemos tus datos si son
                    inexactos, desactualizados o incompletos.
                  </td>
                </tr>
                <tr>
                  <td><strong>C</strong></td>
                  <td><strong>Cancelación / Supresión</strong></td>
                  <td>
                    Solicitar que eliminemos tus datos personales cuando ya no
                    sean necesarios para los fines que motivaron su
                    recopilación.
                  </td>
                </tr>
                <tr>
                  <td><strong>O</strong></td>
                  <td><strong>Oposición</strong></td>
                  <td>
                    Oponerte a que realicemos un tratamiento determinado de tus
                    datos, incluyendo la elaboración de perfiles.
                  </td>
                </tr>
                <tr>
                  <td><strong>P</strong></td>
                  <td><strong>Portabilidad</strong></td>
                  <td>
                    Solicitar una copia de tus datos en un formato electrónico
                    estructurado para transferirlos a otro responsable.
                  </td>
                </tr>
                <tr>
                  <td><strong>B</strong></td>
                  <td><strong>Bloqueo</strong></td>
                  <td>
                    Solicitar el bloqueo temporal del tratamiento de tus datos
                    cuando impugnes su exactitud o legalidad.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: "1rem" }}>
            Para ejercer cualquiera de estos derechos, escríbenos a
            {" "}
            <a href="mailto:contacto@discretasex.cl" className="link">
              contacto@discretasex.cl
            </a>
            {" "}
            indicando el derecho que deseas ejercer y tu nombre completo. Te
            responderemos dentro del plazo máximo de <strong>10 días
            hábiles</strong>, prorrogable por otros 10 días cuando sea
            estrictamente necesario.
          </p>
        </div>

        {/* 5. Delegado de Protección de Datos */}
        <div className="info-card">
          <span className="info-card-icon"><UserCheck size={20} /></span>
          <h3>5. Delegado de Protección de Datos Personales</h3>
          <p>
            Hemos designado un Delegado de Protección de Datos Personales
            (DPD) como punto de contacto para todas las materias relacionadas
            con el tratamiento de tus datos personales. Puedes contactarlo
            directamente para cualquier consulta, solicitud o reclamo:
          </p>
          <div className="contact-item" style={{ marginTop: "0.75rem" }}>
            <span className="contact-item-icon"><Mail size={18} /></span>
            <div>
              <h4>Delegado de Protección de Datos</h4>
              <p>
                <a href="mailto:contacto@discretasex.cl" className="link">
                  contacto@discretasex.cl
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* 6. Seguridad */}
        <div className="info-card">
          <span className="info-card-icon"><Shield size={20} /></span>
          <h3>6. Seguridad de la Información</h3>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas
            adecuadas al riesgo para proteger tus datos personales:
          </p>
          <ul className="info-list">
            <li>
              <strong>Cifrado SSL/TLS</strong> en todas las comunicaciones
              entre tu navegador y nuestro servidor.
            </li>
            <li>
              <strong>Autenticación JWT</strong> con tokens de acceso
              temporales y renovables.
            </li>
            <li>
              <strong>Almacenamiento seguro</strong> con contraseñas
              hasheadas (bcrypt) y datos cifrados en reposo.
            </li>
            <li>
              <strong>Acceso restringido</strong> al personal autorizado,
              con registros de auditoría.
            </li>
            <li>
              <strong>Política de retención:</strong> conservamos tus datos
              solo mientras sean necesarios para los fines descritos o por
              obligaciones legales (máximo 5 años desde la última interacción).
            </li>
          </ul>
        </div>

        {/* 7. Cookies */}
        <div className="info-card">
          <span className="info-card-icon"><Cookie size={20} /></span>
          <h3>7. Cookies</h3>
          <p>
            Utilizamos cookies esenciales para el funcionamiento del sitio:
            carrito de compras, sesión de usuario y preferencias de
            visualización (modo oscuro). Estas cookies no requieren
            consentimiento explícito por ser estrictamente necesarias.
          </p>
          <p>
            No utilizamos cookies de rastreo publicitario, redes sociales ni
            análisis de terceros sin tu consentimiento explícito. Puedes
            configurar tu navegador para rechazar todas las cookies, aunque
            algunas funcionalidades del sitio podrían verse afectadas.
          </p>
        </div>

        {/* 8. Reclamaciones */}
        <div className="info-card">
          <span className="info-card-icon"><Scale size={20} /></span>
          <h3>8. Reclamaciones ante la Agencia</h3>
          <p>
            Si consideras que hemos vulnerado tus derechos en materia de
            protección de datos personales, tienes derecho a presentar una
            reclamación ante la
            <strong> Agencia de Protección de Datos Personales</strong>,
            órgano autónomo creado por la Ley N° 21.719.
          </p>
          <p>
            Antes de recurrir a la Agencia, te invitamos a contactarnos
            directamente para resolver cualquier inconveniente. Nuestro
            Delegado de Protección de Datos (DPD) atenderá tu caso con
            prioridad.
          </p>
          <hr className="info-divider" />
          <p>
            <strong>Última actualización:</strong> junio 2026. Esta
            política de privacidad se actualizará periódicamente para reflejar
            cambios en la legislación o en nuestras prácticas. Te
            notificaremos cualquier cambio sustancial a través del sitio web o
            por correo electrónico.
          </p>
        </div>
      </div>
    </div>
  );
}
