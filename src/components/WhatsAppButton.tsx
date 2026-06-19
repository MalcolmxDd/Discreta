import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "+56912345678";
const WHATSAPP_MSG = encodeURIComponent("¡Hola! Quiero hacer una consulta sobre sus productos.");

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Chatea con nosotros por WhatsApp"
    >
      <MessageCircle size={28} />
    </a>
  );
}
