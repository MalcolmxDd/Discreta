import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";

const faqs = [
  {
    q: "¿El envío es discreto?",
    a: "Sí. Todos los pedidos llegan en una caja opaca sin logos ni indicaciones del contenido. El remitente figura como 'DS Express'.",
  },
  {
    q: "¿Cuánto tardan los envíos?",
    a: "Santiago: 1—2 días hábiles. Regiones: 3—5 días hábiles. Zonas extremas: 5—8 días hábiles. Los envíos gratis aplican sobre $15.000 (RM) y $20.000 (regiones).",
  },
  {
    q: "¿Puedo comprar sin crear una cuenta?",
    a: "¡Claro! Puedes hacer tu pedido como invitado. Solo necesitas ingresar tus datos de envío y email. Si después decides crear una cuenta, tus pedidos quedarán asociados.",
  },
  {
    q: "¿Qué medios de pago aceptan?",
    a: "Aceptamos tarjetas de crédito, débito, Transferencia bancaria y MercadoPago. Pronto incorporaremos más alternativas.",
  },
  {
    q: "¿Cómo sé mi talla de lencería?",
    a: "Cada producto incluye una tabla de tallas en la descripción. Si tienes dudas, escríbenos y te ayudamos a elegir.",
  },
  {
    q: "¿Los juguetes son seguros?",
    a: "Todos nuestros productos son de materiales aprobados: silicona hipoalergénica, libre de ftalatos, ABS libre de BPA. Trabajamos solo con marcas que cumplen estándares internacionales.",
  },
  {
    q: "¿Puedo cancelar mi pedido?",
    a: "Sí, siempre que no haya sido despachado. Escríbenos a hola@discretastore.cl y lo gestionamos.",
  },
  {
    q: "¿Tienen tienda física?",
    a: "Por ahora somos 100% online. Esto nos permite mantener precios justos y la máxima discreción en cada entrega.",
  },
];

export default function FAQ() {
  usePageMeta("Preguntas Frecuentes", "Las dudas más comunes sobre DiscretaStore, respondidas con claridad y sin rodeos.");

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="page page-faq animate-in">
      <div className="info-hero">
        <span className="hero-accent" />
        <h2>Preguntas Frecuentes</h2>
        <p className="info-lead">
          Las dudas más comunes, respondidas con claridad y sin rodeos.
        </p>
      </div>

      <div className="faq-list">
        {faqs.map((faq, i) => (
          <div key={i} className={`faq-item ${openIndex === i ? "faq-open" : ""}`}>
            <button className="faq-question" onClick={() => toggle(i)}>
              <span>{faq.q}</span>
              <ChevronDown size={18} className="faq-chevron" />
            </button>
            <div className="faq-answer">
              <p>{faq.a}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
