<?php
// =============================================================
// DiscretaStore API - Router Principal
// =============================================================

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/Database.php';

setCorsHeaders();

// En modo debug, mostrar errores
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

// Verificar modo mantenimiento (excepto health, auth, admin)
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$requestPath = parse_url($requestUri, PHP_URL_PATH);
$isAdminRoute = str_starts_with($requestPath, '/admin');
$isHealthRoute = $requestPath === '/health' || $requestPath === '';
$isAuthRoute = str_starts_with($requestPath, '/auth');
if (file_exists(__DIR__ . '/.maintenance') && !$isAdminRoute && !$isHealthRoute && !$isAuthRoute) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Estamos en mantenimiento. Vuelve pronto.',
        'maintenance' => true,
    ]);
    exit;
}

// Obtener método HTTP y path

// Parsear la URL
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/api';
$path = parse_url($requestUri, PHP_URL_PATH);

// Remover el base path /api si existe
if (str_starts_with($path, $basePath)) {
    $path = substr($path, strlen($basePath));
}

$path = '/' . trim($path, '/');
$method = $_SERVER['REQUEST_METHOD'];

// =============================================================
// Rutas
// =============================================================

try {
    switch (true) {
        // --- PRODUCTOS ---
        case $path === '/products' && $method === 'GET':
            require __DIR__ . '/routes/products.php';
            listProducts();
            break;

        case preg_match('#^/products/([a-z0-9\-]+)$#', $path, $m) === 1 && $method === 'GET':
            require __DIR__ . '/routes/products.php';
            getProduct($m[1]);
            break;

        // --- CATEGORÍAS ---
        case $path === '/categories' && $method === 'GET':
            require __DIR__ . '/routes/categories.php';
            listCategories();
            break;

        // --- RESEÑAS ---
        case $path === '/reviews' && $method === 'GET':
            require __DIR__ . '/routes/reviews.php';
            listReviews();
            break;

        case $path === '/reviews' && $method === 'POST':
            require __DIR__ . '/routes/reviews.php';
            createReview();
            break;

        // --- AUTH ---
        case $path === '/auth/register' && $method === 'POST':
            require __DIR__ . '/routes/auth.php';
            registerUser();
            break;

        case $path === '/auth/login' && $method === 'POST':
            require __DIR__ . '/routes/auth.php';
            loginUser();
            break;

        case $path === '/auth/me' && $method === 'GET':
            require __DIR__ . '/routes/auth.php';
            getMe();
            break;

        case $path === '/auth/forgot-password' && $method === 'POST':
            require __DIR__ . '/routes/auth.php';
            forgotPassword();
            break;

        case $path === '/auth/reset-password' && $method === 'POST':
            require __DIR__ . '/routes/auth.php';
            resetPassword();
            break;

        // --- ÓRDENES ---
        case $path === '/orders' && $method === 'POST':
            require __DIR__ . '/routes/orders.php';
            createOrder();
            break;

        case $path === '/orders/track' && $method === 'GET':
            require __DIR__ . '/routes/orders.php';
            trackOrder();
            break;

        // --- ADMIN ---
        case $path === '/admin/dashboard' && $method === 'GET':
            require __DIR__ . '/routes/admin.php';
            adminDashboard();
            break;

        case $path === '/admin/products' && $method === 'GET':
            require __DIR__ . '/routes/admin.php';
            adminListProducts();
            break;

        case $path === '/admin/products' && $method === 'POST':
            require __DIR__ . '/routes/admin.php';
            adminCreateProduct();
            break;

        case $path === '/admin/products/update' && $method === 'PUT':
            require __DIR__ . '/routes/admin.php';
            adminUpdateProduct();
            break;

        case $path === '/admin/products/delete' && $method === 'DELETE':
            require __DIR__ . '/routes/admin.php';
            adminDeleteProduct();
            break;

        case $path === '/admin/categories' && $method === 'GET':
            require __DIR__ . '/routes/admin.php';
            adminListCategories();
            break;

        case $path === '/admin/categories' && $method === 'POST':
            require __DIR__ . '/routes/admin.php';
            adminCreateCategory();
            break;

        case $path === '/admin/categories/update' && $method === 'PUT':
            require __DIR__ . '/routes/admin.php';
            adminUpdateCategory();
            break;

        case $path === '/admin/categories/delete' && $method === 'DELETE':
            require __DIR__ . '/routes/admin.php';
            adminDeleteCategory();
            break;

        case $path === '/admin/orders' && $method === 'GET':
            require __DIR__ . '/routes/admin.php';
            adminListOrders();
            break;

        case $path === '/admin/orders' && $method === 'PATCH':
            require __DIR__ . '/routes/admin.php';
            adminUpdateOrderStatus();
            break;

        case $path === '/admin/maintenance' && $method === 'POST':
            requireAdmin();
            require __DIR__ . '/routes/admin.php';
            adminToggleMaintenance();
            break;

        // --- CARRITO (sync para usuarios logueados) ---
        case $path === '/cart' && $method === 'GET':
            require __DIR__ . '/routes/cart.php';
            listCart();
            break;

        case $path === '/cart/sync' && $method === 'POST':
            require __DIR__ . '/routes/cart.php';
            syncCart();
            break;

        // --- WISHLIST ---
        case $path === '/wishlist' && $method === 'GET':
            require __DIR__ . '/routes/wishlist.php';
            listWishlist();
            break;

        case $path === '/wishlist' && $method === 'POST':
            require __DIR__ . '/routes/wishlist.php';
            addToWishlist();
            break;

        case $path === '/wishlist' && $method === 'DELETE':
            require __DIR__ . '/routes/wishlist.php';
            removeFromWishlist();
            break;

        // --- CUPONES ---
        case $path === '/coupons/validate' && $method === 'POST':
            require __DIR__ . '/routes/coupons.php';
            validateCoupon();
            break;

        case $path === '/admin/coupons' && $method === 'GET':
            requireAdmin();
            require __DIR__ . '/routes/coupons.php';
            adminListCoupons();
            break;

        case $path === '/admin/coupons' && $method === 'POST':
            requireAdmin();
            require __DIR__ . '/routes/coupons.php';
            adminCreateCoupon();
            break;

        case $path === '/admin/coupons/update' && $method === 'PUT':
            requireAdmin();
            require __DIR__ . '/routes/coupons.php';
            adminUpdateCoupon();
            break;

        case $path === '/admin/coupons/delete' && $method === 'DELETE':
            requireAdmin();
            require __DIR__ . '/routes/coupons.php';
            adminDeleteCoupon();
            break;

        // --- SITEMAP ---
        case $path === '/sitemap.xml':
            require __DIR__ . '/routes/sitemap.php';
            generateSitemap();
            break;

        // --- UPLOADS ---
        case $path === '/upload/image' && $method === 'POST':
            require __DIR__ . '/routes/uploads.php';
            uploadProductImage();
            break;

        case $path === '/upload/image' && $method === 'DELETE':
            require __DIR__ . '/routes/uploads.php';
            deleteUploadedImage();
            break;

        // --- MERCADOPAGO ---
        case $path === '/mercado-pago/create-preference' && $method === 'POST':
            require __DIR__ . '/routes/mercado_pago.php';
            createPaymentPreference();
            break;

        case $path === '/mercado-pago/confirm-payment' && $method === 'POST':
            require __DIR__ . '/routes/mercado_pago.php';
            confirmPayment();
            break;

        case $path === '/mercado-pago/webhook' && $method === 'POST':
            require __DIR__ . '/routes/mercado_pago.php';
            handleWebhook();
            break;

        // --- HEALTH CHECK ---
        case $path === '/health' || $path === '':
            jsonResponse([
                'status' => 'ok',
                'app' => 'DiscretaStore API',
                'version' => '1.0.0',
            ]);
            break;

        // --- 404 ---
        default:
            errorResponse('Ruta no encontrada', 404);
    }
} catch (PDOException $e) {
    logError('PDO Error: ' . $e->getMessage(), ['uri' => $requestUri ?? '', 'method' => $method ?? '']);
    if (DEBUG_MODE) {
        errorResponse('Error de base de datos: ' . $e->getMessage(), 500);
    } else {
        errorResponse('Error interno del servidor', 500);
    }
} catch (Exception $e) {
    logError('Error: ' . $e->getMessage(), ['uri' => $requestUri ?? '', 'method' => $method ?? '']);
    if (DEBUG_MODE) {
        errorResponse('Error: ' . $e->getMessage(), 500);
    } else {
        errorResponse('Error interno del servidor', 500);
    }
}
