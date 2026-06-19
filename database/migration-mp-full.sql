-- =============================================================
-- Migración Completa: MercadoPago - Columnas faltantes en orders
-- =============================================================
-- Ejecutar en phpMyAdmin > SQL
-- Si alguna columna ya existe, el ALTER se puede ignorar (dará error "Duplicate column")
-- =============================================================

-- Columnas MP para la preferencia de pago
ALTER TABLE orders
  ADD COLUMN shipping_region VARCHAR(100) DEFAULT NULL AFTER shipping_city,
  ADD COLUMN shipping_phone VARCHAR(50) DEFAULT NULL AFTER shipping_email,
  ADD COLUMN discount INT DEFAULT 0 AFTER total,
  ADD COLUMN mp_preference_id VARCHAR(255) DEFAULT NULL AFTER discount,
  ADD COLUMN mp_payment_id VARCHAR(255) DEFAULT NULL AFTER mp_preference_id,
  ADD COLUMN mp_status VARCHAR(50) DEFAULT NULL AFTER mp_payment_id;

-- =============================================================
-- Nota: Si alguna columna ya existe y el ALTER falla,
-- ejecuta los ALTER individuales omitiendo las que ya existan.
-- =============================================================
