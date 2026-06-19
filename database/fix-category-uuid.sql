-- =============================================================
-- Fix: Categoría creada con UUID en vez de slug legible
-- Uso: Copiar y pegar TODO en phpMyAdmin > SQL
--
-- El slug 'succionador' ya existe en la BD (la categoría UUID
-- se creó con ese slug). Así que en vez de INSERT, hacemos
-- UPDATE directo de la fila existente.
--
-- La FK no deja cambiar el PK mientras haya hijos, así que:
--   1. Desconectamos productos temporalmente (→ NULL)
--   2. Cambiamos el ID de UUID → 'succionador'
--   3. Reconectamos productos buscándolos por nombre
-- =============================================================

-- Paso 1: Desconectar productos que apuntan a la categoría UUID
--         (para poder cambiar el PK sin violar la FK)
UPDATE products SET category_id = NULL
WHERE category_id = '48d9ea7a-2db2-4e97-9072-87532d46f6fe';

-- Paso 2: Cambiar el ID de la categoría de UUID a slug legible
UPDATE categories
SET id = 'succionador'
WHERE id = '48d9ea7a-2db2-4e97-9072-87532d46f6fe';

-- Paso 3: Reconectar los productos que quedaron con category_id = NULL
--         (buscando por nombre que contenga "Succionador")
UPDATE products SET category_id = 'succionador'
WHERE category_id IS NULL
  AND (name LIKE '%Succionador%' OR name LIKE '%succionador%');
