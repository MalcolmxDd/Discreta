<?php
require_once __DIR__ . '/config.php';

// =============================================================
// CORS
// =============================================================

function setCorsHeaders(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = array_map('trim', explode(',', ALLOWED_ORIGINS));
    
    if (in_array($origin, $allowed)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Vary: Origin");
    } else {
        // No permitir orígenes no whitelisteados
        header("Access-Control-Allow-Origin: " . ($allowed[0] ?? ''));
        header("Vary: Origin");
    }
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Content-Type: application/json; charset=utf-8");
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// =============================================================
// Respuestas JSON
// =============================================================

function jsonResponse(mixed $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function errorResponse(string $message, int $code = 400): void {
    jsonResponse(['error' => $message], $code);
}

function successResponse(mixed $data = null, string $message = 'OK'): void {
    jsonResponse(['success' => true, 'message' => $message, 'data' => $data]);
}

// =============================================================
// JWT (Manual - sin dependencias externas)
// =============================================================

function base64UrlEncode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

function generateJWT(array $payload): string {
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;
    
    $headerEncoded = base64UrlEncode(json_encode($header));
    $payloadEncoded = base64UrlEncode(json_encode($payload));
    $signature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", JWT_SECRET, true);
    $signatureEncoded = base64UrlEncode($signature);
    
    return "$headerEncoded.$payloadEncoded.$signatureEncoded";
}

function verifyJWT(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    
    [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;
    
    // Validar algoritmo
    $header = json_decode(base64UrlDecode($headerEncoded), true);
    if (!$header || ($header['alg'] ?? '') !== 'HS256') return null;
    
    $signature = base64UrlDecode($signatureEncoded);
    $expectedSignature = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", JWT_SECRET, true);
    
    if (!hash_equals($expectedSignature, $signature)) return null;
    
    $payload = json_decode(base64UrlDecode($payloadEncoded), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) return null;
    
    return $payload;
}

function getAuthUser(): ?array {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    
    if (preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
        $token = $matches[1];
        return verifyJWT($token);
    }
    
    return null;
}

function requireAuth(): array {
    $user = getAuthUser();
    if (!$user) {
        errorResponse('No autorizado. Token requerido.', 401);
    }
    return $user;
}

function requireAdmin(): array {
    $user = requireAuth();
    if (!isset($user['role']) || $user['role'] !== 'admin') {
        errorResponse('Acceso denegado. Se requieren permisos de administrador.', 403);
    }
    return $user;
}

// =============================================================
// Validaciones
// =============================================================

function validateEmail(string $email): bool {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function validateRequired(string $value, int $minLength = 1): bool {
    return strlen(trim($value)) >= $minLength;
}

function getJsonInput(): array {
    $input = json_decode(file_get_contents('php://input'), true);
    return $input ?? [];
}

function getQueryParam(string $key, mixed $default = null): mixed {
    return $_GET[$key] ?? $default;
}

// =============================================================
// Rate Limiting (Login attempts)
// =============================================================

function checkLoginRateLimit(): string {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = sys_get_temp_dir() . '/discretastore_login_' . md5($ip);
    
    $data = ['count' => 0, 'first' => time()];
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true) ?? $data;
        // Reset if window expired (15 min = 900 sec)
        if (time() - $data['first'] > 900) {
            $data = ['count' => 0, 'first' => time()];
        }
    }
    
    if ($data['count'] >= 5) {
        $wait = 900 - (time() - $data['first']);
        $minutes = ceil($wait / 60);
        errorResponse("Demasiados intentos. Intenta de nuevo en {$minutes} min.", 429);
    }
    
    return $file;
}

function recordLoginAttempt(string $file): void {
    $data = ['count' => 1, 'first' => time()];
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true) ?? $data;
        $data['count']++;
    }
    file_put_contents($file, json_encode($data));
}

function clearLoginAttempts(string $file): void {
    if (file_exists($file)) unlink($file);
}

// =============================================================
// Validación de contraseña segura
// =============================================================

function validatePasswordStrength(string $password): ?string {
    if (strlen($password) < 8) {
        return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!preg_match('/[A-Z]/', $password)) {
        return 'La contraseña debe contener al menos una mayúscula';
    }
    if (!preg_match('/[0-9]/', $password)) {
        return 'La contraseña debe contener al menos un número';
    }
    return null; // Válida
}

// =============================================================
// UUID Generator
// =============================================================

function generateUUID(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

// =============================================================
// Server-side logging
// =============================================================

function logError(string $message, mixed $context = null): void {
    $logDir = __DIR__ . '/logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }
    $timestamp = date('Y-m-d H:i:s');
    $contextStr = $context ? ' | ' . json_encode($context, JSON_UNESCAPED_UNICODE) : '';
    $line = "[$timestamp] $message$contextStr" . PHP_EOL;
    @file_put_contents($logDir . '/error.log', $line, FILE_APPEND);
}

// =============================================================
// Sanitización
// =============================================================

function sanitize(string $value): string {
    return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
}
