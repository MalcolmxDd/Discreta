-- =============================================================
-- Reset Admin User
-- =============================================================
-- Primero intenta actualizar si ya existe:
UPDATE users 
SET password_hash = '$2y$10$c7YKI/v2f.d2wyH5a2cB9OJjIQuYXx/7yKWQODO7s5ZHqLZ1pveDe',
    name = 'Admin',
    role = 'admin'
WHERE email = 'admin@discretastore.cl';

-- Si no existe (0 filas afectadas), lo crea:
INSERT IGNORE INTO users (id, name, email, password_hash, role, created_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Admin',
    'admin@discretastore.cl',
    '$2y$10$c7YKI/v2f.d2wyH5a2cB9OJjIQuYXx/7yKWQODO7s5ZHqLZ1pveDe',
    'admin',
    NOW()
);
