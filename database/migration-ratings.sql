-- =============================================================
-- Migración: Recalcular ratings de productos desde reseñas
-- =============================================================
-- Ejecutar en phpMyAdmin después de subir el nuevo backend PHP.
-- Actualiza todas las products.rating con el promedio real de reviews.

UPDATE products p
SET p.rating = (
    SELECT COALESCE(ROUND(AVG(r.rating), 1), 0)
    FROM reviews r
    WHERE r.product_id = p.id
);
