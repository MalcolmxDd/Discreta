<div align="center">
  <br />
  <img src="public/icons.svg" alt="DiscretaStore" width="100" />
  <br />
  <h1 align="center">DiscretaStore</h1>
  <p align="center">
    <strong>Placer que trasciende — E-commerce de juguetes sexuales con estilo moderno y discreto</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" alt="TypeScript 6" />
    <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8" />
    <img src="https://img.shields.io/badge/PHP-8-777BB4?logo=php&logoColor=white" alt="PHP 8" />
    <img src="https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white" alt="MySQL 8" />
    <img src="https://img.shields.io/badge/MercadoPago-Checkout_Pro-009EE3?logo=mercadopago&logoColor=white" alt="MercadoPago" />
  </p>
</div>

---

## ✨ Descripción

**DiscretaStore** es una tienda online moderna y profesional de juguetes sexuales con enfoque en la **discreción, calidad y diseño**. Construida con un stack moderno (React 19 + TypeScript + PHP 8 + MySQL), ofrece una experiencia de compra fluida, estética cuidada y pagos integrados con MercadoPago.

Marca registrada como **DiscretaStore** — antes "Lumina" (renombrada Mayo 2026).

🌐 **Sitio en vivo:** [https://discretasex.cl](https://discretasex.cl)

---

## 🚀 Características

### 🛍️ Frontend (React + TypeScript)

- **Catálogo completo** con 12+ productos, 6 categorías, filtros por precio/categoría y ordenamiento (precio, rating, nombre)
- **Búsqueda con autocomplete** y debounce de 300ms
- **Carrito de compras** persistente (localStorage para invitados, sincronizado con servidor para usuarios logueados)
- **Wishlist / Favoritos** con badge en header
- **Checkout paso a paso** con validación de formularios y resumen de orden
- **Panel de administración** completo: dashboard, CRUD de productos/categorías, gestión de pedidos y cupones
- **Autenticación** login/register con JWT, roles (user/admin), protección de rutas
- **Modo oscuro/claro** con persistencia
- **SEO on-page** con meta tags dinámicos, Open Graph, Twitter Cards y JSON-LD (schema.org)
- **Breadcrumbs** automáticos desde la URL
- **Notificaciones Toast** con auto-dismiss
- **Skeletons** y estados de carga
- **Error Boundary** global
- **Image Lightbox** con zoom
- **Páginas informativas:** Envíos, Devoluciones, FAQ, Términos, Privacidad
- **Tracking de pedidos** por email
- **Diseño responsive** con header sticky, menú hamburguesa, footer completo
- **Botón WhatsApp** flotante

### ⚙️ Backend (PHP 8 + MySQL)

- **API RESTful** con router centralizado
- **Autenticación JWT** con refresh, rate limiting (5 intentos/15 min) y password strength
- **CRUD completo** de productos, categorías, cupones y órdenes
- **Integración MercadoPago Checkout Pro** con:
  - Creación de preferencias de pago
  - Webhook IPN con verificación de firma (x-signature)
  - Endpoint de respaldo `confirmPayment()` para casos donde el webhook no llegue
  - Anti-duplicado: stock y cupones solo se descuentan una vez
- **Envío de emails** con template HTML para confirmación de órdenes
- **Generación de sitemap.xml** dinámico
- **Subida de imágenes** de productos
- **Modo mantenimiento** configurable
- **CORS** configurable para desarrollo y producción
- **Logging** de errores y webhooks

### 🎨 Diseño

- Paleta: fondo `#fdf5f7`, accent `#e94e8a`, surface `#ffffff`
- Tipografía: **Playfair Display** (logo) + **Outfit** (cuerpo)
- Animaciones: hover con 3D tilt, parallax, particle field, FloatingOrbs, SectionReveal (IntersectionObserver), count-up animado
- Iconos: **Lucide React**
- CSS modular por feature (7 archivos CSS)
- Tono chileno informal, sin vulgaridad — profesional, discreto, confiable

---

## 🧰 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | React 19 + TypeScript 6 |
| **Bundler** | Vite 8 |
| **Ruteo** | React Router DOM 7 |
| **Estado** | React Context + useReducer |
| **Estilos** | CSS puro (variables globales, modo oscuro) |
| **Backend** | PHP 8 + REST API |
| **Base de Datos** | MySQL 8 |
| **Auth** | JWT (manual, compatible firebase/php-jwt) |
| **Pagos** | MercadoPago Checkout Pro (con Webhook IPN) |
| **Hosting** | HostGator cPanel (HTTPS con Let's Encrypt) |
| **Testing** | Vitest + React Testing Library + jsdom |

---

## 📁 Estructura del Proyecto

```
discretastore/
├── api/                          # Backend PHP
│   ├── config.php                # Configuración (DB, JWT, MP)
│   ├── Database.php              # Conexión PDO singleton
│   ├── env_loader.php            # Cargador de .env
│   ├── helpers.php               # Funciones auxiliares (CORS, JWT, respuestas)
│   ├── index.php                 # Router principal (~40 rutas)
│   ├── webhook.php               # Webhook MercadoPago (legacy)
│   ├── email_templates.php       # Templates HTML para emails
│   ├── routes/
│   │   ├── admin.php             # CRUD admin (productos, categorías, órdenes)
│   │   ├── auth.php              # Login, register, forgot/reset password
│   │   ├── cart.php              # Carrito sincronizado para usuarios
│   │   ├── categories.php        # Listado público de categorías
│   │   ├── coupons.php           # Validación y CRUD de cupones
│   │   ├── mercado_pago.php      # Preferencias, confirmPayment, webhook
│   │   ├── orders.php            # Creación y tracking de órdenes
│   │   ├── products.php          # Listado público de productos
│   │   ├── reviews.php           # Reseñas de productos
│   │   ├── sitemap.php           # Generación dinámica de sitemap.xml
│   │   └── uploads.php           # Subida de imágenes
│   └── .htaccess                 # Rewrite rules + seguridad
├── database/
│   ├── schema.sql                # Esquema completo de la BD
│   └── migration-*.sql           # Migraciones incrementales
├── src/                          # Frontend React
│   ├── App.tsx                   # Componente raíz + rutas
│   ├── main.tsx                  # Entry point
│   ├── constants.ts              # Constantes centralizadas
│   ├── types.ts                  # Tipos TypeScript globales
│   ├── api/                      # Capa HTTP (client + endpoints)
│   │   ├── client.ts             # Cliente HTTP base con JWT
│   │   ├── auth.ts
│   │   ├── cart.ts
│   │   ├── categories.ts
│   │   ├── coupons.ts
│   │   ├── mercadoPago.ts
│   │   ├── orders.ts
│   │   ├── products.ts
│   │   ├── reviews.ts
│   │   ├── upload.ts
│   │   └── wishlist.ts
│   ├── components/               # Componentes reutilizables
│   │   ├── Breadcrumbs.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ImageLightbox.tsx
│   │   ├── Layout.tsx            # Header + nav + footer
│   │   ├── ProductCard.tsx
│   │   ├── ProductJsonLd.tsx
│   │   ├── ReviewSection.tsx
│   │   ├── Skeleton.tsx
│   │   ├── ToastContainer.tsx
│   │   ├── TrackingScripts.tsx
│   │   └── WhatsAppButton.tsx
│   ├── context/                  # Estado global (Context + useReducer)
│   │   ├── AdminContext.tsx
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   ├── ToastContext.tsx
│   │   └── WishlistContext.tsx
│   ├── hooks/                    # Custom hooks
│   │   ├── useDebounce.ts
│   │   └── usePageMeta.ts
│   ├── pages/                    # Páginas (~20 rutas)
│   │   ├── Home/
│   │   ├── Products/
│   │   ├── ProductDetail/
│   │   ├── Cart/
│   │   ├── Checkout/
│   │   ├── CheckoutSuccess/
│   │   ├── About/
│   │   ├── Contact/
│   │   ├── Account/
│   │   ├── Wishlist/
│   │   ├── OrderStatus/
│   │   ├── Envios/
│   │   ├── Devoluciones/
│   │   ├── FAQ/
│   │   ├── Terminos/
│   │   ├── Privacidad/
│   │   ├── NotFound/
│   │   ├── auth/ (Login, Register, ResetPassword)
│   │   ├── ForgotPassword/
│   │   └── Admin/ (Dashboard, Products, Categories, Orders, Coupons)
│   ├── styles/                   # CSS modular por feature
│   │   ├── layout.css
│   │   ├── components.css
│   │   ├── home.css
│   │   ├── products.css
│   │   ├── cart.css
│   │   ├── pages.css
│   │   └── admin.css
│   ├── data/
│   │   └── categories.tsx        # Iconos por categoría (Lucide)
│   └── test/                     # Tests (11 suites, 104 tests)
├── public/
│   ├── icons.svg
│   ├── robots.txt
│   └── sitemap.xml
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .htaccess                     # Reglas Apache para SPA + seguridad
```

---

## 🗄️ Base de Datos

**7 tablas** en MySQL 8:

| Tabla | Descripción |
|-------|-------------|
| `products` | 12+ productos con JSON para tags/features, gradientes, imágenes |
| `categories` | 6 categorías con slug y descripción |
| `users` | Usuarios con bcrypt password_hash y roles |
| `orders` | Órdenes con datos de envío, MP, descuentos y stock tracking |
| `order_items` | Items de cada orden con precio congelado |
| `wishlist_items` | Favoritos por usuario |
| `reviews` | Reseñas con rating 1-5 |

Seed data: 12 productos, 6 categorías, 14 reseñas, 1 admin.

---

## 🚦 API Endpoints

### Públicos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/products` | Listar productos (filtros: `search`, `category`, `min_price`, `max_price`, `sort`) |
| GET | `/api/products/:slug` | Detalle de producto |
| GET | `/api/categories` | Listar categorías |
| GET | `/api/reviews` | Listar reseñas |
| POST | `/api/reviews` | Crear reseña |
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Inicio de sesión (rate limited) |
| POST | `/api/orders` | Crear orden (checkout) |
| GET | `/api/orders/track` | Tracking por email |
| POST | `/api/coupons/validate` | Validar cupón de descuento |
| POST | `/api/mercado-pago/create-preference` | Crear preferencia de pago MP |
| POST | `/api/mercado-pago/webhook` | Webhook IPN MercadoPago |
| POST | `/api/mercado-pago/confirm-payment` | Confirmación manual de pago (fallback) |
| GET | `/api/sitemap.xml` | Sitemap dinámico |

### Autenticados (JWT)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/auth/me` | Perfil del usuario |
| GET | `/api/cart` | Obtener carrito del usuario |
| POST | `/api/cart/sync` | Sincronizar carrito |
| GET | `/api/wishlist` | Obtener favoritos |
| POST | `/api/wishlist` | Agregar a favoritos |
| DELETE | `/api/wishlist` | Quitar de favoritos |

### Admin (JWT + role=admin)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Estadísticas del panel |
| GET/POST | `/api/admin/products` | CRUD productos |
| PUT | `/api/admin/products/update` | Actualizar producto |
| DELETE | `/api/admin/products/delete` | Eliminar producto |
| GET/POST | `/api/admin/categories` | CRUD categorías |
| PUT | `/api/admin/categories/update` | Actualizar categoría |
| DELETE | `/api/admin/categories/delete` | Eliminar categoría |
| GET/PATCH | `/api/admin/orders` | Listar/actualizar órdenes |
| GET/POST/PUT/DELETE | `/api/admin/coupons` | CRUD cupones |
| POST | `/api/admin/maintenance` | Toggle modo mantenimiento |

---

## 🛠️ Instalación y Desarrollo

### Requisitos

- Node.js 20+
- PHP 8.1+
- MySQL 8
- Composer (para dependencias PHP)

### Frontend

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (con proxy a API)
npm run dev

# Compilar para producción
npm run build

# Ejecutar tests
npm test

# Vista previa del build
npm run preview
```

### Backend

```bash
# Ir a la carpeta API
cd api

# Instalar dependencias PHP (MercadoPago SDK)
composer install

# Configurar entorno
cp .env.example .env
# Editar .env con credenciales de BD, JWT y MercadoPago

# Iniciar servidor de desarrollo
php -S localhost:8000
```

### Base de Datos

```bash
# Ejecutar schema principal
mysql -u usuario -p nombre_bd < database/schema.sql

# Ejecutar migraciones en orden
mysql -u usuario -p nombre_bd < database/migration-images.sql
mysql -u usuario -p nombre_bd < database/migration-mp.sql
mysql -u usuario -p nombre_bd < database/migration-coupons.sql
mysql -u usuario -p nombre_bd < database/migration-coupon-code.sql
# ... y así sucesivamente
```

### Variables de Entorno (`api/.env`)

```env
DB_HOST=localhost
DB_NAME=discretastore
DB_USER=usuario
DB_PASS=contraseña

JWT_SECRET=tu_secreto_jwt
JWT_EXPIRY=604800

MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...
MP_WEBHOOK_SECRET=tu_webhook_secret
MP_SANDBOX_MODE=true

ALLOWED_ORIGINS=http://localhost:5173,https://discretasex.cl
DEBUG_MODE=true
```

---

## 🧪 Tests

**104 tests** en **11 suites**, todos pasando ✅

```bash
# Ejecutar todos los tests
npm test

# Modo watch
npm run test:watch
```

| Suite | Tests |
|-------|-------|
| ProductCard | 12 |
| Checkout flow | 7 |
| Search & Filters | 12 |
| Cart | 5 |
| Wishlist | 5 |
| Auth | 10 |
| Admin | 8 |
| Layout | 6 |
| ReviewSection | 6 |
| Reviews (API) | 6 |
| Products Data | 23 |

---

## 🚢 Despliegue

### HostGator cPanel

1. **Frontend:** `npm run build` → subir `dist/` a `public_html/`
2. **Backend:** Subir `api/` a `public_html/api/`
3. **Base de datos:** Importar schema + migraciones desde phpMyAdmin
4. **SSL:** Let's Encrypt desde cPanel
5. **.htaccess:** Incluido para SPA routing y seguridad

### Scripts de deploy

```bash
# Generar zip para subir
cd deploy
# api.zip + dist.zip listos para cPanel
```

---

## 🔐 Seguridad

- **JWT** con expiry configurable (7 días)
- **Rate limiting** en login: 5 intentos / 15 min
- **Password strength**: mínimo 8 caracteres, 1 mayúscula, 1 número
- **Webhook signature verification**: x-signature con timestamp + SHA256
- **CORS** con orígenes permitidos configurable
- **Modo mantenimiento** para proteger durante actualizaciones
- **Anti-duplicado**: stock y cupones solo se descuentan en pago confirmado
- **.env** protegido via .htaccess
- **Vendor** bloqueado via mod_rewrite

---

## 📊 Estado del Proyecto

✅ **Frontend:** 100% completo
✅ **Backend API:** 100% funcional
✅ **Base de datos:** 7 tablas con migraciones
✅ **Pagos:** MercadoPago Checkout Pro + Webhook (sandbox probado)
✅ **Emails:** Confirmación de órdenes funcionando
✅ **Admin panel:** CRUD completo + dashboard
✅ **Tests:** 104 tests en 11 suites
✅ **SEO:** Meta tags dinámicos, Open Graph, JSON-LD, sitemap

### Pendiente

- [ ] Pasar MercadoPago a producción real
- [ ] Persistir wishlist en BD para usuarios logueados
- [ ] Tests e2e (Cypress/Playwright)
- [ ] Migrar a Zustand v5 (recomendado)

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/feature-name`)
3. Commit tus cambios (`git commit -m 'feat: add feature'`)
4. Push a la rama (`git push origin feature/feature-name`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados © DiscretaStore.

---

<div align="center">
  <p>Hecho con ❤️ y cuidado en Chile</p>
  <p>
    <a href="https://discretasex.cl">🌐 discretasex.cl</a>
  </p>
</div>
