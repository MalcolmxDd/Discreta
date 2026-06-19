import { Target, Eye, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../../hooks/usePageMeta";

export default function About() {
  usePageMeta("Nosotros", "Creemos que el placer es un derecho, no un lujo. Nacemos para desmontar tabúes con diseño, honestidad y cuidado.");

  return (
    <div className="page page-about animate-in">
      <div className="about-hero">
        <span className="hero-accent" />
        <h2>Nuestra historia</h2>
        <p className="about-lead">
          Creemos que el placer es un derecho, no un lujo. Nacemos para
          desmontar tabúes con diseño, honestidad y cuidado.
        </p>
      </div>

      <div className="about-grid-full">
        <div className="about-card">
          <span className="about-card-icon">
            <Target size={22} />
          </span>
          <h3>Propósito</h3>
          <p>
            Cada producto en DiscretaStore es seleccionado por su calidad, seguridad
            y capacidad de inspirar. No vendemos objetos: curamos experiencias.
            Trabajamos con marcas que comparten nuestra ética: materiales
            seguros, producción responsable y diseño intencional.
          </p>
        </div>
        <div className="about-card">
          <span className="about-card-icon">
            <Eye size={22} />
          </span>
          <h3>Visión</h3>
          <p>
            Imaginamos un mundo donde la sexualidad se vive sin vergüenza,
            con información, respeto y autonomía. Donde ir a una sexshop es
            tan natural como comprar un libro o un perfume. Donde el diseño
            y el placer caminan de la mano.
          </p>
        </div>
        <div className="about-card about-card-wide">
          <span className="about-card-icon">
            <Heart size={22} />
          </span>
          <h3>Valores</h3>
          <p>
            Transparencia total en materiales y precios. Educación sexual
            basada en evidencia. Atención con empatía y sin juicio.
            Biodiversidad del deseo: no hay formas correctas ni incorrectas
            de sentir placer.
          </p>
        </div>
      </div>

      <div className="about-cta">
        <p>¿Listo para explorar?</p>
        <Link to="/productos" className="btn btn-primary btn-glow">
          Ver colección <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
