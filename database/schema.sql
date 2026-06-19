-- =============================================================
-- DiscretaStore - Esquema MySQL para HostGator cPanel
-- Copia y pega TODO este script en phpMyAdmin > SQL
-- =============================================================

-- -----------------------------------------------------------
-- 1. CATEGORÍAS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  position INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 2. PRODUCTOS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description VARCHAR(300) NOT NULL,
  long_description TEXT,
  price INT NOT NULL CHECK (price > 0),
  original_price INT DEFAULT NULL,
  image TEXT,
  gradient VARCHAR(255) DEFAULT NULL,
  category_id VARCHAR(50) DEFAULT NULL,
  tags JSON DEFAULT NULL,
  rating DECIMAL(2,1) DEFAULT 0,
  in_stock TINYINT(1) DEFAULT 1,
  stock_count INT DEFAULT 0,
  features JSON DEFAULT NULL,
  is_featured TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 3. USUARIOS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  phone VARCHAR(50) DEFAULT NULL,
  default_address TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 4. ÓRDENES
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  subtotal INT NOT NULL,
  shipping_cost INT DEFAULT 0,
  total INT NOT NULL,
  shipping_name VARCHAR(200) NOT NULL,
  shipping_email VARCHAR(255) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_zip VARCHAR(20) NOT NULL,
  payment_method VARCHAR(50) DEFAULT NULL,
  payment_id VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 5. ITEMS DE ÓRDENES
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(50) DEFAULT NULL,
  product_name VARCHAR(200) NOT NULL,
  product_price INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 6. WISHLIST
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist_items (
  user_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 7. RESEÑAS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(36) DEFAULT NULL,
  user_name VARCHAR(100) DEFAULT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- 8. ÍNDICES
-- -----------------------------------------------------------
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_instock ON products(in_stock);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_orders_email ON orders(shipping_email);
CREATE INDEX idx_users_email ON users(email);

-- =============================================================
-- DATOS INICIALES (seed data)
-- =============================================================

-- 6 categorías
INSERT INTO categories (id, name, slug, description, position) VALUES
  ('vibradores', 'Vibradores', 'vibradores', 'Precisión y placer en cada curva', 1),
  ('dildos', 'Dildos', 'dildos', 'Formas que inspiran', 2),
  ('lubricantes', 'Lubricantes', 'lubricantes', 'Suavidad absoluta', 3),
  ('parejas', 'Para Parejas', 'parejas', 'Conecta de nuevas formas', 4),
  ('lenceria', 'Lencería', 'lenceria', 'Lo que llevas puesto importa', 5),
  ('bienestar', 'Bienestar', 'bienestar', 'Cuídate, conócete', 6);

-- 12 productos
INSERT INTO products (id, name, slug, description, long_description, price, original_price, image, gradient, category_id, tags, rating, in_stock, stock_count, features, is_featured) VALUES
  ('vib-001', 'Luna', 'luna', 'Vibrador bullet de precisión con 10 modos', 'Luna es discreción y potencia en miniatura. Su cuerpo recubierto de silicona hipoalergénica se desliza con suavidad mientras sus 10 modos de vibración exploran cada rincón. Impermeable, silencioso y con carga USB magnética. Diseñado para viajar contigo.', 1290, NULL, 'https://picsum.photos/seed/luna/400/400', 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', 'vibradores', '[\"bullet\",\"silicona\",\"impermeable\",\"silencioso\"]', 4.5, 1, 25, '[\"10 modos de vibración\",\"Silicona hipoalergénica\",\"Impermeable IPX7\",\"Carga USB magnética\",\"Ultra silencioso (< 40dB)\"]', 1),
  ('vib-002', 'Gema', 'gema', 'Vibrador puntual con curvas anatómicas', 'Gema está diseñado para el placer de punto preciso. Su cabeza curvada en ángulo anatómico alcanza las zonas más sensibles con una precisión que roza lo quirúrgico. Recubrimiento suave al tacto y 8 intensidades progresivas.', 1890, 2290, 'https://picsum.photos/seed/gema/400/400', 'linear-gradient(135deg, #2d1b3d 0%, #441e5a 50%, #6b2fa0 100%)', 'vibradores', '[\"point\",\"precisión\",\"anatómic\",\"silicona\"]', 4.8, 1, 15, '[\"8 intensidades progresivas\",\"Cabeza curvada anatómica\",\"Silicona matte suave\",\"Recarga USB-C\",\"Modo silencio\"]', 1),
  ('dil-001', 'Eros', 'eros', 'Consolador clásico de silicona con ventosa', 'Eros combina el diseño clásico con materiales modernos. Silicona platino-curada de grado médico, base de ventosa para manos libres, y una curva pensada para el punto G y próstata. La textura suave con vetas sutiles ofrece sensación realista.', 2250, NULL, 'https://picsum.photos/seed/eros/400/400', 'linear-gradient(135deg, #1c1410 0%, #2a1d15 50%, #3d281c 100%)', 'dildos', '[\"clásico\",\"ventosa\",\"silicona\",\"realista\"]', 4.3, 1, 20, '[\"Silicona platino-curada\",\"Base de ventosa antideslizante\",\"Curva para punto G/próstata\",\"Textura realista suave\",\"Libre de ftalatos\"]', 0),
  ('dil-002', 'Ventosa', 'ventosa', 'Dildo de succión con ventosa de alto agarre', 'Ventosa lleva la estabilidad al siguiente nivel. Su base de succión crea un vacío firme en cualquier superficie lisa, liberando tus manos para nuevas posibilidades. Silicona dual-density: exterior suave, núcleo firme.', 2590, NULL, 'https://picsum.photos/seed/ventosa/400/400', 'linear-gradient(135deg, #0d1321 0%, #1d2d50 50%, #27496d 100%)', 'dildos', '[\"succión\",\"dual-density\",\"silicona\",\"manos libres\"]', 4.6, 1, 12, '[\"Tecnología dual-density\",\"Ventosa de alto agarre\",\"Silicona grado médico\",\"14 cm insertables\",\"Fácil limpieza\"]', 1),
  ('lub-001', 'Aqua', 'aqua', 'Lubricante base agua con extracto de aloe', 'Aqua es pureza líquida. Fórmula base agua con aloe vera y extracto de manzanilla que hidrata mientras lubrica. Sin parabenos, sin glicerina, sin fragancias. Compatible con preservativos de látex y juguetes de silicona.', 390, NULL, 'https://picsum.photos/seed/aqua/400/400', 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #1a3c5c 100%)', 'lubricantes', '[\"base agua\",\"aloe\",\"hipoalergénico\",\"compatible\"]', 4.7, 1, 50, '[\"Base agua transparente\",\"Con aloe vera y manzanilla\",\"Sin parabenos ni glicerina\",\"Compatible con latex y silicona\",\"Duración media-larga\"]', 1),
  ('lub-002', 'Fuego', 'fuego', 'Lubricante con efecto cálido progresivo', 'Fuego despierta los sentidos. Su efecto térmico progresivo comienza suave y se intensifica con el contacto y la respiración. Base silicona de larga duración que no se seca. Ideal para masajes y juegos sensoriales.', 490, 590, 'https://picsum.photos/seed/fuego/400/400', 'linear-gradient(135deg, #1a0d0d 0%, #3a1515 50%, #5c2020 100%)', 'lubricantes', '[\"térmico\",\"silicona\",\"larga duración\",\"sensorial\"]', 4.2, 1, 40, '[\"Efecto cálido progresivo\",\"Base silicona larga duración\",\"No se seca\",\"Transparente e inodoro\",\"Masaje y juego sensorial\"]', 0),
  ('par-001', 'Couple', 'couple', 'Anillo vibrador para pareja con control remoto', 'Couple convierte cada momento en una experiencia compartida. Anillo ajustable con vibrador integrado que estimula a ambos durante la penetración. Incluye control remoto inalámbrico para que ella o él tomen el mando.', 2990, NULL, 'https://picsum.photos/seed/couple/400/400', 'linear-gradient(135deg, #1a0f0a 0%, #3a2015 50%, #4d2b1f 100%)', 'parejas', '[\"anillo\",\"control remoto\",\"pareja\",\"dual\"]', 4.4, 1, 18, '[\"Vibrador integrado dual\",\"Control remoto inalámbrico\",\"Anillo ajustable talla única\",\"Silicona suave\",\"7 modos de vibración\"]', 0),
  ('par-002', 'Pulse', 'pulse', 'Masajeador de punto G y clítoris para dos', 'Pulse sincroniza el placer compartido. Diseñado ergonómicamente para estimular simultáneamente punto G y clítoris durante el acto. Su brazo curvo envuelve y su motor de ondas pulsantes crea ritmos hipnóticos.', 3490, NULL, 'https://picsum.photos/seed/pulse/400/400', 'linear-gradient(135deg, #1a0d1a 0%, #2d1a3a 50%, #4a265a 100%)', 'parejas', '[\"dual\",\"punto G\",\"clítoris\",\"ondas\"]', 4.9, 1, 10, '[\"Estimulación dual simultánea\",\"Ondas pulsantes rítmicas\",\"Diseño ergonómico curvo\",\"Silicona hipoalergénica\",\"Recarga magnética\"]', 1),
  ('len-001', 'Seda', 'seda', 'Babydoll de seda con encaje floral', 'Seda susurra al caminar. Confeccionado en seda natural con paneles de encaje floral francés. Tirantes ajustables, escote en V profundo y caída hasta media pierna. El embalaje en caja de regalo lo convierte en un presente en sí mismo.', 1890, NULL, 'https://picsum.photos/seed/seda/400/400', 'linear-gradient(135deg, #1a0f14 0%, #2d1822 50%, #4a2238 100%)', 'lenceria', '[\"seda\",\"encaje\",\"babydoll\",\"delicado\"]', 4.1, 1, 22, '[\"Seda natural 22 momme\",\"Encaje floral francés\",\"Tirantes ajustables\",\"Presentación en caja de regalo\",\"Lavado a mano recomendado\"]', 0),
  ('len-002', 'Noir', 'noir', 'Conjunto de encaje negro con detalles dorados', 'Noir es poder silencioso. Sujetador balconette con aro y braguita a juego en encaje calado negro con detalles en hilo dorado. Cierre de ganchos trasero, tirantes ajustables y talle alto. Para quien sabe lo que quiere.', 2490, NULL, 'https://picsum.photos/seed/noir/400/400', 'linear-gradient(135deg, #0a0a0f 0%, #14141c 50%, #1e1a24 100%)', 'lenceria', '[\"encaje\",\"conjunto\",\"dorado\",\"elegante\"]', 4.6, 1, 15, '[\"Sujetador balconette con aro\",\"Braguita talle alto\",\"Encaje calado con hilo dorado\",\"Tirantes ajustables\",\"Cierre de ganchos trasero\"]', 1),
  ('bie-001', 'Zen', 'zen', 'Masajeador corporal de ondas electromagnéticas', 'Zen no es un juguete, es una herramienta de bienestar. Tecnología de ondas electromagnéticas de baja frecuencia que alivia tensiones musculares y estimula la circulación. Ideal después del ejercicio o como preludio de la intimidad.', 3990, NULL, 'https://picsum.photos/seed/zen/400/400', 'linear-gradient(135deg, #0a1a14 0%, #0d261e 50%, #143528 100%)', 'bienestar', '[\"masajeador\",\"ondas\",\"muscular\",\"relajación\"]', 4.3, 1, 8, '[\"Ondas electromagnéticas baja frecuencia\",\"3 modos + 5 intensidades\",\"Alivia tensión muscular\",\"Estimula circulación\",\"Carga USB-C, 6h autonomía\"]', 0),
  ('bie-002', 'Ritual', 'ritual', 'Kit de aceites de masaje con aroma natural', 'Ritual convierte el masaje en ceremonia. Tres aceites de origen natural: lavanda (relajación), canela (calor) y ylang-ylang (sensual). Fórmula no grasa que se absorbe sin manchar. Libre de parabenos y sulfatos.', 890, NULL, 'https://picsum.photos/seed/ritual/400/400', 'linear-gradient(135deg, #1a1410 0%, #2a1e15 50%, #3d2a1c 100%)', 'bienestar', '[\"aceite\",\"masaje\",\"natural\",\"kit\"]', 4.0, 1, 30, '[\"3 aceites de 50ml c/u\",\"Lavanda, Canela, Ylang-Ylang\",\"Fórmula no grasa\",\"Libre de parabenos y sulfatos\",\"Envase de vidrio reciclable\"]', 0);

-- 14 reseñas iniciales
INSERT INTO reviews (id, product_id, user_name, rating, comment) VALUES
  ('rev-001', 'vib-001', 'Camila R.', 5, 'Pequeño pero poderoso. La vibración es profunda y silenciosa, perfecto para viajar.'),
  ('rev-002', 'vib-001', 'Valentina M.', 4, 'Muy buen producto. La carga magnética es súper práctica. Solo le pondría un modo más de intensidad baja.'),
  ('rev-003', 'vib-002', 'Ignacio L.', 5, 'La precisión es increíble. La curva anatómica marca la diferencia. 10/10.'),
  ('rev-004', 'vib-002', 'Francisca T.', 5, 'Lo compré para regalo y la persona quedó fascinada. La calidad se siente altísima.'),
  ('rev-005', 'dil-001', 'Diego A.', 4, 'Buena calidad, la silicona se siente premium. La ventosa funciona bien en superficies lisas.'),
  ('rev-006', 'dil-002', 'Sofía G.', 5, 'Dual-density es otro nivel. Firme por dentro pero suave al tacto por fuera. La ventosa es firme.'),
  ('rev-007', 'lub-001', 'María José C.', 5, 'El mejor lubricante que he probado. No se vuelve pegajoso y dura bastante. El aloe se siente rico.'),
  ('rev-008', 'lub-002', 'Pablo N.', 4, 'El efecto cálido es sutil pero agradable. Ideal para masajes en pareja.'),
  ('rev-009', 'par-001', 'Carla y Tomás', 5, 'Transformó nuestra intimidad. El control remoto le da un juego muy entretenido a la cosa.'),
  ('rev-010', 'par-002', 'Andrea V.', 5, 'La estimulación dual simultánea es brutal. Diseño ergonómico perfecto, no estorba para nada.'),
  ('rev-011', 'len-001', 'Carolina F.', 4, 'Hermoso diseño. La seda es de alta calidad. Me quedó un poco largo, pero nada que no se pueda arreglar.'),
  ('rev-012', 'len-002', 'Javiera R.', 5, 'Me siento poderosa con este conjunto. El detalle dorado es elegante sin ser demasiado.'),
  ('rev-013', 'bie-001', 'Matías S.', 4, 'Lo uso después del gym y realmente alivia la tensión muscular. No esperaba tanto de un producto así.'),
  ('rev-014', 'bie-002', 'Daniela P.', 4, 'Los aceites huelen delicioso, especialmente el de lavanda. Se absorben bien sin dejar sensación grasosa.');

-- Usuario admin por defecto (contraseña: admin123, hasheada con bcrypt)
INSERT INTO users (id, name, email, password_hash, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Admin', 'admin@discretastore.cl', '$2y$10$0EZtkDUxM2PxOGSlbhIHeuym/Cgudj03JuQ48JhTEcgSXQcg4Bo/2', 'admin');

-- =============================================================
-- Fin del script
-- =============================================================
