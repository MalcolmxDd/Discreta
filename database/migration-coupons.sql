-- Tabla de cupones de descuento
CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  value INT NOT NULL,
  min_amount INT DEFAULT NULL,
  max_uses INT DEFAULT NULL,
  used_count INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  expires_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cupón por defecto para compatibilidad
INSERT IGNORE INTO coupons (id, code, type, value, min_amount, max_uses, used_count, is_active)
VALUES (UUID(), 'DISCRETA10', 'percentage', 10, 10000, 100, 0, 1);
