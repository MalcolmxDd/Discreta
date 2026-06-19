import React, { useRef, useEffect, useState, useCallback, cloneElement } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Heart,
  ChevronLeft,
  ChevronRight,
  Star,
  Shield,
  Truck,
  Package,
  ArrowRight,
  ArrowUpRight,
  Gem,
  Eye,
  Award,
} from "lucide-react";
import { usePageMeta } from "../../hooks/usePageMeta";
import { AUTO_SCROLL_INTERVAL_MS, CAROUSEL_SWIPE_THRESHOLD } from "../../constants";
import { fetchProducts } from "../../api/products";
import { fetchCategories } from "../../api/categories";
import { categoryIcons as catIcons } from "../../data/categories";
import type { Product } from "../../types";
import type { Category } from "../../types";
import ProductCard from "../../components/ProductCard";
import heroImage from "../../img/imagen2.jpeg";

const categoryIcons = Object.fromEntries(
  Object.entries(catIcons).map(([k, v]) => [k, cloneElement(v as React.ReactElement<{size?: number}>, { size: 22 })])
);



// ========== HOOKS ==========

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function useCountUp(target: number, duration: number, start: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let animId: number;
    const step = (now: number) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, duration, start]);
  return count;
}

// ========== COMPONENTS ==========

function FloatingOrbs() {
  return (
    <div className="hero-orbs" aria-hidden="true">
      {[
        { top: -60, right: -40, delay: 0, morph: 12 },
        { bottom: -30, left: 10, delay: 2, morph: 16 },
        { top: 25, left: 50, delay: 1, morph: 14 },
        { bottom: 20, right: 20, delay: 3, morph: 18 },
      ].map((orb, i) => (
        <div
          key={i}
          className="hero-orb"
          style={{
            top: orb.top !== undefined ? `${orb.top}px` : undefined,
            bottom: orb.bottom !== undefined ? `${orb.bottom}px` : undefined,
            left: orb.left !== undefined ? `${orb.left}%` : undefined,
            right: orb.right !== undefined ? `${orb.right}px` : undefined,
            animationDelay: `${orb.delay}s`,
            animationDuration: `${orb.morph}s`,
          }}
        />
      ))}
      <div className="hero-ring-large" />
      <div className="hero-ring-small" />
    </div>
  );
}

function ParticleField({ mousePos }: { mousePos: { x: number; y: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(mousePos);
  posRef.current = mousePos;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; size: number; speedX: number; speedY: number; alpha: number }[] = [];

    const resize = () => {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.speedX + posRef.current.x * 0.15;
        p.y += p.speedY + posRef.current.y * 0.1;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(233, 78, 138, ${p.alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}

function SectionReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal-section ${visible ? "is-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

// ========== MAIN PAGE ==========

function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DiscretaStore",
    url: window.location.origin,
    description: "Tienda online de juguetes sexuales con envío discreto a todo Chile.",
    areaServed: "CL",
    contactPoint: {
      "@type": "ContactPoint",
      email: "hola@discretastore.cl",
      contactType: "customer service",
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export default function Home() {
  usePageMeta("Inicio", "Descubre una curaduría de objetos de deseo diseñados para explorar tu sensualidad sin límites ni vergüenza. Envío discreto.");

  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalProducts, setTotalProducts] = useState(12);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [featuredProducts, allCategories, allProducts] = await Promise.all([
          fetchProducts({ featured: true }),
          fetchCategories(),
          fetchProducts(),
        ]);
        if (mounted) {
          const withRating = (products: Product[]) => products.filter(p => p.rating > 0);
          // Si hay destacados explícitos (is_featured=1), mostrarlos todos aunque tengan rating 0
          setFeatured(featuredProducts.length > 0
            ? featuredProducts
            : withRating([...allProducts]).sort((a, b) => b.rating - a.rating).slice(0, 6)
          );
          setCategories(allCategories);
          setTotalProducts(allProducts.length);
        }
      } catch {
        // Si falla la API, no mostrar error crítico en home
        if (mounted) {
          setFeatured([]);
          setCategories([]);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const heroRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const autoScrollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Stats reveal state
  const statsReveal = useScrollReveal();
  const statProducts = useCountUp(totalProducts, 1500, statsReveal.visible);
  const statRating = useCountUp(49, 1200, statsReveal.visible);
  const statDiscreet = useCountUp(100, 1000, statsReveal.visible);

  // Hero mouse parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Measure carousel
  useEffect(() => {
    if (featured.length === 0) return;
    measureSlideWidth();
    window.addEventListener("resize", measureSlideWidth);
    return () => window.removeEventListener("resize", measureSlideWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featured.length]);

  function measureSlideWidth() {
    if (!trackRef.current) return;
    const first = trackRef.current.children[0] as HTMLElement | undefined;
    if (!first) return;
    const gap = parseFloat(getComputedStyle(trackRef.current).gap) || 16;
    setSlideWidth(first.offsetWidth + gap);
  }

  const goTo = useCallback(
    (index: number) => {
      setFeaturedIndex(index);
      resetAutoScroll();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [featured.length]
  );

  const resetAutoScroll = useCallback(() => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    autoScrollRef.current = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featured.length);
    }, AUTO_SCROLL_INTERVAL_MS);
  }, [featured.length]);

  useEffect(() => {
    resetAutoScroll();
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [resetAutoScroll]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) > CAROUSEL_SWIPE_THRESHOLD) {
      if (delta > 0) goTo((featuredIndex + 1) % featured.length);
      else goTo((featuredIndex - 1 + featured.length) % featured.length);
    } else {
      resetAutoScroll();
    }
  };

  const offset = slideWidth > 0 ? -(featuredIndex * slideWidth) : 0;

  return (
    <div className="page page-home">
      <OrganizationJsonLd />
      {/* ========== HERO ========== */}
      <section className="hero" ref={heroRef}>
        <ParticleField mousePos={mousePos} />
        <FloatingOrbs />

        <div className="hero-content">
          <div className="hero-badge" style={{ animationDelay: "0.05s" }}>
            <Sparkles size={14} />
            <span>Colección Junio 2026</span>
          </div>

          <h1 className="hero-headline">
            <span className="hw" style={{ animationDelay: "0.1s" }}>Placer</span>{" "}
            <span className="hw hw-accent" style={{ animationDelay: "0.25s" }}>que</span>{" "}
            <span className="hw hw-italic" style={{ animationDelay: "0.4s" }}>trasciende</span>
            <span className="hw hw-dot" style={{ animationDelay: "0.5s" }}>.</span>
          </h1>
          <p className="hero-subtitle" style={{ animationDelay: "0.65s" }}>
            Descubre una curaduría de objetos de deseo diseñados para explorar
            tu sensualidad sin límites ni vergüenza.
          </p>

          <div className="hero-actions" style={{ animationDelay: "0.85s" }}>
            <Link to="/productos" className="btn btn-primary btn-glow">
              Explorar Colección
              <ArrowRight size={18} />
            </Link>
            <Link to="/about" className="btn btn-outline">
              Conocer más
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="hero-trust" style={{ animationDelay: "1.0s" }}>
            <div className="trust-item">
              <Package size={14} />
              <span>Envío discreto</span>
            </div>
            <div className="trust-dot" />
            <div className="trust-item">
              <Shield size={14} />
              <span>Pago seguro</span>
            </div>
            <div className="trust-dot" />
            <div className="trust-item">
              <Truck size={14} />
              <span>Envío a todo Chile</span>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual-bg" />
          <div
            className="hero-img-wrap"
            style={{
              transform: `perspective(1000px) rotateY(${mousePos.x * 4}deg) rotateX(${mousePos.y * -3}deg)`,
            }}
          >
            <div className="hero-img-glow" aria-hidden="true" />
            <img src={heroImage} alt="" className="hero-img" />
            <div className="hero-img-decor" aria-hidden="true">
              <Sparkles size={14} />
            </div>
          </div>
          <div className="hero-visual-caption">
            <span className="hero-caption-dot" />
            <span>Fotografía editorial · Colección 2026</span>
          </div>
        </div>
      </section>

      {/* ========== CATEGORIES ========== */}
      <SectionReveal>
        <section className="section-categories">
          <div className="section-header">
            <h2 className="section-title">
              Categorías
              <span className="section-title-accent"> / Explora</span>
            </h2>
            <Link to="/productos" className="section-link">
              Ver todo <ArrowRight size={14} />
            </Link>
          </div>
          <div className="categories-scroll">
            <div className="categories-track">
              {categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  to={`/productos?categoria=${cat.slug}`}
                  className="category-card-alt"
                  style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                >
                  <span className="category-icon-wrap">
                    {categoryIcons[cat.id] || <Sparkles size={22} />}
                  </span>
                  <h3>{cat.name}</h3>
                  <p>{cat.description}</p>
                  <span className="category-arrow">
                    <ArrowUpRight size={14} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* ========== FEATURED ========== */}
      <SectionReveal>
        <section className="section-featured">
          <div className="featured-header">
            <div>
              <h2 className="section-title">
                Destacados
                <span className="section-title-accent"> / Lo más amado</span>
              </h2>
              <p className="featured-subtitle">Nuestros favoritos de la comunidad</p>
            </div>
            <div className="featured-nav">
              <button
                className="featured-arrow"
                onClick={() => goTo((featuredIndex - 1 + featured.length) % featured.length)}
                aria-label="Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="featured-arrow"
                onClick={() => goTo((featuredIndex + 1) % featured.length)}
                aria-label="Siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div
            className="featured-viewport"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              ref={trackRef}
              className="featured-track"
              style={{ transform: `translateX(${offset}px)` }}
            >
              {featured.map((p) => (
                <div key={p.id} className="featured-item">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>

          <div className="featured-dots">
            {featured.map((_, i) => (
              <button
                key={i}
                className={`featured-dot ${i === featuredIndex ? "active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`Ir al producto ${i + 1}`}
              />
            ))}
          </div>
        </section>
      </SectionReveal>

      {/* ========== STATS ========== */}
      <SectionReveal>
        <section className="section-stats" ref={statsReveal.ref}>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-icon">
                <Gem size={22} />
              </span>
              <span className="stat-value">{statProducts}+</span>
              <span className="stat-label">Productos seleccionados</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-icon">
                <Shield size={22} />
              </span>
              <span className="stat-value">{statDiscreet}%</span>
              <span className="stat-label">Envío discreto garantizado</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-icon">
                <Star size={22} />
              </span>
              <span className="stat-value">{statRating / 10}</span>
              <span className="stat-label">Valoración promedio</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-icon">
                <Truck size={22} />
              </span>
              <span className="stat-value stat-value-text">Envío</span>
              <span className="stat-label">Seguro y rápido a todo Chile</span>
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* ========== TRUST BADGES (marquee) ========== */}
      <SectionReveal>
        <section className="section-marquee">
          <div className="marquee-track">
            <div className="marquee-content">
              {[
                { icon: Shield, text: "Pago 100% Seguro" },
                { icon: Package, text: "Embalaje Discreto" },
                { icon: Truck, text: "Envío a Todo Chile" },
                { icon: Award, text: "Calidad Garantizada" },
                { icon: Heart, text: "Atención Personalizada" },
                { icon: Eye, text: "Privacidad Total" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="marquee-item">
                    <Icon size={16} />
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
            <div className="marquee-content" aria-hidden="true">
              {[
                { icon: Shield, text: "Pago 100% Seguro" },
                { icon: Package, text: "Embalaje Discreto" },
                { icon: Truck, text: "Envío a Todo Chile" },
                { icon: Award, text: "Calidad Garantizada" },
                { icon: Heart, text: "Atención Personalizada" },
                { icon: Eye, text: "Privacidad Total" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="marquee-item">
                    <Icon size={16} />
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* ========== CTA ========== */}
      <SectionReveal>
        <section className="section-cta">
          <div className="cta-card-alt">
            <div className="cta-glow" aria-hidden="true" />
            <div className="cta-glow-2" aria-hidden="true" />
            <div className="cta-content">
              <div className="cta-icon">
                <Heart size={28} />
              </div>
              <h2>¿Primera vez?</h2>
              <p>Cada cuerpo es único. Explora a tu ritmo, sin presión, sin juicio.</p>
              <div className="cta-actions">
                <Link to="/about" className="btn btn-primary btn-glow">
                  Conoce nuestra filosofía
                  <ArrowRight size={18} />
                </Link>
                <Link to="/faq" className="btn btn-outline">
                  Preguntas frecuentes
                </Link>
              </div>
            </div>
          </div>
        </section>
      </SectionReveal>
    </div>
  );
}
