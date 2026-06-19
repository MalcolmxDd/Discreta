-- =============================================================
-- Migración: MercadoPago - Agregar mp_preference_id a orders
-- Ejecutar en phpMyAdmin después de deployar api/
-- =============================================================

ALTER TABLE orders
  ADD COLUMN mp_preference_id VARCHAR(255) DEFAULT NULL AFTER total,
  ADD COLUMN mp_payment_id VARCHAR(255) DEFAULT NULL AFTER mp_preference_id,
  ADD COLUMN mp_status VARCHAR(50) DEFAULT NULL AFTER mp_payment_id;
