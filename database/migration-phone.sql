-- Agregar columna shipping_phone a la tabla orders
ALTER TABLE orders ADD COLUMN shipping_phone VARCHAR(50) DEFAULT NULL AFTER shipping_email;
