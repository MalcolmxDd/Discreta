-- =============================================================
-- MercadoPago - Agregar columnas individualmente
-- =============================================================
-- Ejecuta los ALTER de a uno en phpMyAdmin
-- Si una columna ya existe, SQL mostrará error "Duplicate column"
-- → simplemente SALTEA ese ALTER y sigue con el siguiente
-- =============================================================

-- 1) Región de envío (para cálculo de costo)
ALTER TABLE orders ADD COLUMN shipping_region VARCHAR(100) DEFAULT NULL AFTER shipping_city;

-- 2) Teléfono de contacto del comprador
ALTER TABLE orders ADD COLUMN shipping_phone VARCHAR(50) DEFAULT NULL AFTER shipping_email;

-- 3) Descuento aplicado por cupón
ALTER TABLE orders ADD COLUMN discount INT DEFAULT 0 AFTER total;

-- 4) ID de la preferencia en MercadoPago
ALTER TABLE orders ADD COLUMN mp_preference_id VARCHAR(255) DEFAULT NULL AFTER discount;

-- 5) ID del pago en MercadoPago (lo envía el webhook)
ALTER TABLE orders ADD COLUMN mp_payment_id VARCHAR(255) DEFAULT NULL AFTER mp_preference_id;

-- 6) Estado del pago según MP (approved, pending, rejected)
ALTER TABLE orders ADD COLUMN mp_status VARCHAR(50) DEFAULT NULL AFTER mp_payment_id;

-- =============================================================
-- Para verificar qué columnas tiene actualmente la tabla:
-- SHOW COLUMNS FROM orders;
-- =============================================================
