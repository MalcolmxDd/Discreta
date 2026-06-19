// ========== PRODUCTOS ==========

/** Cantidad máxima de productos relacionados a mostrar */
export const RELATED_MAX = 4;

/** Cantidad máxima de sugerencias en autocomplete */
export const SUGGESTIONS_MAX = 5;

/** Cap máximo de cantidad por producto en el carrito */
export const CART_MAX_QUANTITY = 99;

// ========== FILTROS ==========

/** Precio máximo del slider (no es un límite — solo filtra cuando el slider baja) */
export const PRICE_MAX = 500000;

/** Paso del slider de precio */
export const PRICE_STEP = 1000;

// ========== BÚSQUEDA ==========

/** Delay del debounce en la búsqueda (ms) */
export const DEBOUNCE_MS = 300;

// ========== TIMERS ==========

/** Duración del toast en pantalla (ms) */
export const TOAST_DURATION_MS = 4000;

/** Duración de la animación de salida del toast (ms) */
export const TOAST_EXIT_MS = 250;

/** Intervalo de auto-scroll del carrusel de destacados (ms) */
export const AUTO_SCROLL_INTERVAL_MS = 4000;

/** Tiempo antes de redirigir después del checkout exitoso (ms) */
export const CHECKOUT_REDIRECT_MS = 3000;

// ========== ENVÍOS ==========

/** Monto mínimo para envío gratis en RM */
export const FREE_SHIPPING_RM = 15000;

/** Monto mínimo para envío gratis en regiones */
export const FREE_SHIPPING_REGIONS = 20000;

/** Costo fijo de envío a zonas extremas */
export const SHIPPING_COST_EXTREME = 3990;

/** Umbral de swipe táctil para el carrusel (px) */
export const CAROUSEL_SWIPE_THRESHOLD = 50;

// ========== ENVÍO (Checkout) ==========

export const CHILEAN_REGIONS = [
  "Región Metropolitana",
  "Región de Valparaíso",
  "Región del Biobío",
  "Región de La Araucanía",
  "Región del Maule",
  "Región del Libertador B. O'Higgins",
  "Región de Los Lagos",
  "Región de Coquimbo",
  "Región de Antofagasta",
  "Región de Tarapacá",
  "Región de Atacama",
  "Región de Los Ríos",
  "Región de Arica y Parinacota",
  "Región de Magallanes",
  "Región de Aysén",
  "Región de Ñuble",
] as const;

export const SHIPPING_COST_RM = 0;
export const SHIPPING_COST_REGIONS = 5990;


export const EXTREME_REGIONS = [
  "Región de Magallanes",
  "Región de Aysén",
  "Región de Arica y Parinacota",
];

// ========== RUTAS ==========

export const ROUTES = {
  HOME: "/",
  PRODUCTS: "/productos",
  CART: "/cart",
  CHECKOUT: "/checkout",
  WISHLIST: "/wishlist",
  ABOUT: "/about",
  CONTACT: "/contact",
  ENVIOS: "/envios",
  DEVOLUCIONES: "/devoluciones",
  FAQ: "/faq",
  TERMINOS: "/terminos",
  PRIVACIDAD: "/privacidad",
  LOGIN: "/login",
  REGISTER: "/register",
  ORDER_STATUS: "/order-status",
  ACCOUNT: "/account",
  ADMIN: "/admin",
  ADMIN_LOGIN: "/admin/login",
} as const;
