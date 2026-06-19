-- =============================================================
-- Migration: Unificar `image` e `images` en solo `images`
-- Ejecutar en phpMyAdmin > SQL (SOLO si la columna `images` ya existe)
-- =============================================================

-- 1. Limpiar registros corruptos que tengan el string "Array" (bug anterior)
UPDATE products SET images = NULL WHERE images = 'Array';

-- 2. Poblar images con image para los que tengan image pero no images
UPDATE products SET images = JSON_ARRAY(image) WHERE (images IS NULL OR images = '[]' OR images = 'null') AND image IS NOT NULL AND image != '';

-- 3. Si algún producto tiene image vacío y images vacío, poner un array vacío
UPDATE products SET images = '[]' WHERE images IS NULL;

-- =============================================================
-- NOTA: La columna `image` se mantiene por ahora para no romper
-- código legacy. En una migración futura, cuando confirmes que
-- ningún código PHP la referencia, podés dropearla con:
--
-- ALTER TABLE products DROP COLUMN image;
--
-- Por ahora el backend PHP escribe en ambas columnas automáticamente.
-- =============================================================
