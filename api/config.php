<?php
// =============================================================
// Configuración de la base de datos
// =============================================================
// Las credenciales se cargan desde .env (fuera del webroot o en api/.env).
// Si no existe .env, se usan los valores por defecto (desarrollo local).

require_once __DIR__ . '/env_loader.php';
loadEnv(__DIR__);

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'marce144_discretastore');
define('DB_USER', getenv('DB_USER') ?: 'marce144_discretastore');
define('DB_PASS', getenv('DB_PASS') ?: 'discreta123');
define('DB_CHARSET', getenv('DB_CHARSET') ?: 'utf8mb4');

// JWT Secret
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'd1scret4st0r3_jwt_s3cr3t_k3y_2k26_!@#$%');
define('JWT_EXPIRY', 86400 * 7); // 7 días en segundos

// CORS - Orígenes permitidos
define('ALLOWED_ORIGINS', getenv('ALLOWED_ORIGINS') ?: 'http://localhost:5173,https://discretasex.cl');

// Modo debug
define('DEBUG_MODE', getenv('DEBUG_MODE') === 'true');

// MercadoPago
define('MP_ACCESS_TOKEN', getenv('MP_ACCESS_TOKEN') ?: '');
define('MP_PUBLIC_KEY', getenv('MP_PUBLIC_KEY') ?: '');
define('MP_WEBHOOK_SECRET', getenv('MP_WEBHOOK_SECRET') ?: '');
define('MP_SANDBOX_MODE', getenv('MP_SANDBOX_MODE') !== 'false');
