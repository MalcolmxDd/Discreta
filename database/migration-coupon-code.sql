-- =============================================================
-- Migration: Agregar columnas faltantes a orders
-- Tu BD ya tiene: shipping_region, mp_preference_id, mp_payment_id, mp_status
-- Solo agregamos lo que falta:
--   discount, coupon_code, coupon_discount, stock_deducted
-- Ejecutar en phpMyAdmin después del deploy
-- =============================================================

ALTER TABLE orders ADD COLUMN discount INT DEFAULT 0 AFTER total;
ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) DEFAULT NULL AFTER payment_method;
ALTER TABLE orders ADD COLUMN coupon_discount INT DEFAULT 0 AFTER coupon_code;
ALTER TABLE orders ADD COLUMN stock_deducted TINYINT DEFAULT 0 AFTER coupon_discount;
