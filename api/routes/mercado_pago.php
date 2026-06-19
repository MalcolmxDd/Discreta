<?php
// =============================================================
// MercadoPago Integration
// Checkout Pro: create preference → redirect → webhook
// =============================================================

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/orders.php';

use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Preference\PreferenceClient;
use MercadoPago\Client\Common\RequestOptions;
use MercadoPago\Exceptions\MPApiException;

function configureMercadoPago(): void {
    MercadoPagoConfig::setAccessToken(MP_ACCESS_TOKEN);
}

function getSiteId(): string {
    return 'MLC'; // MercadoLibre Chile
}

// =============================================================
// POST /api/mercado-pago/create-preference
// Crea orden + preferencia de pago, retorna init_point
// =============================================================

function createPaymentPreference(): void {
    $db = Database::getConnection();
    $input = getJsonInput();

    // Validar campos requeridos
    $name = sanitize($input['shipping_name'] ?? '');
    $email = sanitize($input['shipping_email'] ?? '');
    $phone = sanitize($input['shipping_phone'] ?? '');
    $address = sanitize($input['shipping_address'] ?? '');
    $city = sanitize($input['shipping_city'] ?? '');
    $zip = sanitize($input['shipping_zip'] ?? '');
    $region = sanitize($input['shipping_region'] ?? '');
    $items = $input['items'] ?? [];
    $userId = $input['user_id'] ?? null;

    if (!validateRequired($name, 2)) {
        errorResponse('El nombre debe tener al menos 2 caracteres');
    }
    if (!validateEmail($email)) {
        errorResponse('Email inválido');
    }
    if (!validateRequired($address, 10)) {
        errorResponse('La dirección debe tener al menos 10 caracteres');
    }
    if (!validateRequired($city)) {
        errorResponse('La ciudad es requerida');
    }
    if (!preg_match('/^\d{4,8}$/', $zip)) {
        errorResponse('El código postal debe tener entre 4 y 8 dígitos');
    }
    if (empty($items) || !is_array($items)) {
        errorResponse('Debe incluir al menos un producto');
    }

    // Calcular subtotal desde BD
    $subtotal = 0;
    $orderItems = [];

    $stmt = $db->prepare("SELECT id, name, price, stock_count, in_stock FROM products WHERE id = :id LIMIT 1");

    foreach ($items as $item) {
        $productId = sanitize($item['product_id'] ?? '');
        $quantity = (int)($item['quantity'] ?? 1);

        if (!$productId || $quantity < 1) {
            errorResponse('Item inválido: product_id y quantity > 0 requeridos');
        }

        $stmt->execute([':id' => $productId]);
        $product = $stmt->fetch();

        if (!$product) {
            errorResponse("Producto no encontrado: $productId", 404);
        }
        if (!$product['in_stock']) {
            errorResponse("Producto agotado: {$product['name']}");
        }
        if ($product['stock_count'] < $quantity) {
            errorResponse("Stock insuficiente para: {$product['name']} (disponible: {$product['stock_count']})");
        }

        $lineTotal = (int)$product['price'] * $quantity;
        $subtotal += $lineTotal;

        $orderItems[] = [
            'product_id' => $productId,
            'product_name' => $product['name'],
            'product_price' => (int)$product['price'],
            'quantity' => $quantity,
            'line_total' => $lineTotal,
        ];
    }

    // Calcular envío
    $extremeRegions = ['Región de Magallanes', 'Región de Aysén', 'Región de Arica y Parinacota'];
    if (in_array($region, $extremeRegions)) {
        $shippingCost = 3990;
    } elseif ($region === 'Región Metropolitana') {
        $shippingCost = 0;
    } else {
        $shippingCost = 5990;
    }

    // Validar cupón
    $coupon = sanitize($input['coupon'] ?? '');
    $discount = 0;
    $appliedCoupon = null;
    if ($coupon) {
        $cpStmt = $db->prepare("SELECT * FROM coupons WHERE code = :code AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW()) AND (max_uses IS NULL OR used_count < max_uses)");
        $cpStmt->execute([':code' => strtoupper($coupon)]);
        $cpData = $cpStmt->fetch();
        if ($cpData) {
            $cpValue = (int)$cpData['value'];
            if ($cpData['type'] === 'percentage') {
                $discount = (int)round($subtotal * $cpValue / 100);
            } else {
                $discount = min($cpValue, $subtotal);
            }
            $appliedCoupon = $cpData['code'];
        }
    }

    $total = $subtotal + $shippingCost - $discount;
    if ($total < 0) $total = 0;

    // Generar UUID para la orden
    $orderId = generateUUID();

    try {
        $db->beginTransaction();

        // Insertar orden (status: pending, stock_deducted=0 — se descuenta en webhook al confirmar pago)
        $stmt = $db->prepare("
            INSERT INTO orders (id, user_id, status, subtotal, shipping_cost, total, discount,
                               shipping_name, shipping_email, shipping_phone, shipping_address, shipping_city, shipping_zip, shipping_region,
                               payment_method, coupon_code, stock_deducted, created_at, updated_at)
            VALUES (:id, :user_id, 'pending', :subtotal, :shipping_cost, :total, :discount,
                    :name, :email, :phone, :address, :city, :zip, :region,
                    'mercadopago', :coupon, 0, NOW(), NOW())
        ");
        $stmt->execute([
            ':id' => $orderId,
            ':user_id' => $userId,
            ':subtotal' => $subtotal,
            ':shipping_cost' => $shippingCost,
            ':total' => $total,
            ':discount' => $discount,
            ':name' => $name,
            ':email' => $email,
            ':phone' => $phone ?: null,
            ':address' => $address,
            ':city' => $city,
            ':zip' => $zip,
            ':region' => $region,
            ':coupon' => $appliedCoupon,
        ]);

        // Insertar items (sin descontar stock — se descuenta cuando el webhook confirma el pago)
        $itemStmt = $db->prepare("
            INSERT INTO order_items (id, order_id, product_id, product_name, product_price, quantity, line_total)
            VALUES (:id, :order_id, :product_id, :product_name, :product_price, :quantity, :line_total)
        ");

        foreach ($orderItems as $oi) {
            $itemId = generateUUID();
            $itemStmt->execute([
                ':id' => $itemId,
                ':order_id' => $orderId,
                ':product_id' => $oi['product_id'],
                ':product_name' => $oi['product_name'],
                ':product_price' => $oi['product_price'],
                ':quantity' => $oi['quantity'],
                ':line_total' => $oi['line_total'],
            ]);
        }

        // ── Crear preferencia en MercadoPago ──
        configureMercadoPago();
        $client = new PreferenceClient();
        $opts = new RequestOptions();
        $opts->setCustomHeaders(["X-Idempotency-Key: " . uniqid('', true)]);

        $mpItems = [];
        foreach ($orderItems as $oi) {
            $mpItems[] = [
                'id' => $oi['product_id'],
                'title' => $oi['product_name'],
                'description' => mb_substr($oi['product_name'], 0, 256),
                'currency_id' => 'CLP',
                'quantity' => (int)$oi['quantity'],
                'unit_price' => (float)$oi['product_price'],
            ];
        }

        // Agregar envío como item separado si tiene costo
        if ($shippingCost > 0) {
            $mpItems[] = [
                'id' => 'shipping',
                'title' => 'Costo de envío',
                'description' => 'Envío a ' . $region,
                'currency_id' => 'CLP',
                'quantity' => 1,
                'unit_price' => (float)$shippingCost,
            ];
        }

        $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'];

        $preferenceData = [
            'items' => $mpItems,
            'payer' => [
                'name' => $name,
                'email' => $email,
            ],
            'back_urls' => [
                'success' => $baseUrl . '/checkout/success?order_id=' . $orderId,
                'failure' => $baseUrl . '/checkout?status=failure',
                'pending' => $baseUrl . '/checkout?status=pending',
            ],
            'auto_return' => 'approved',
            'notification_url' => $baseUrl . '/api/webhook.php',
            'statement_descriptor' => 'DISCRETASTORE',
            'external_reference' => $orderId,
            'expires' => false,
        ];

        $preference = $client->create($preferenceData, $opts);

        // Guardar mp_preference_id en la orden
        $updStmt = $db->prepare("UPDATE orders SET mp_preference_id = :mp_id WHERE id = :id");
        $updStmt->execute([
            ':mp_id' => $preference->id,
            ':id' => $orderId,
        ]);

        $db->commit();

        successResponse([
            'order_id' => $orderId,
            'total' => $total,
            'subtotal' => $subtotal,
            'shipping_cost' => $shippingCost,
            'discount' => $discount,
            'items_count' => count($orderItems),
            'init_point' => $preference->init_point,
            'preference_id' => $preference->id,
        ], 'Preferencia de pago creada exitosamente');

    } catch (MPApiException $e) {
        $db->rollBack();
        $apiResponse = $e->getApiResponse();
        $content = $apiResponse->getContent();
        $msg = $content['message'] ?? 'Error al crear preferencia de pago';
        logError('MercadoPago API Error: ' . json_encode($content), ['order_id' => $orderId]);
        errorResponse($msg, 500);
    } catch (Exception $e) {
        $db->rollBack();
        logError('createPaymentPreference Error: ' . $e->getMessage(), ['order_id' => $orderId ?? '']);
        errorResponse('Error al procesar el pago', 500);
    }
}

// =============================================================
// POST /api/mercado-pago/webhook
// IPN: recibe notificaciones de MercadoPago
// =============================================================

function validateWebhookSignature(string $dataId): bool {
    if (!MP_WEBHOOK_SECRET) {
        return true; // Sin secret configurado, saltar validación
    }

    $signature = $_SERVER['HTTP_X_SIGNATURE'] ?? $_SERVER['HTTP_X_SIGNATURE_HEADER'] ?? '';
    if (!$signature) {
        logError('Webhook: sin firma x-signature', ['data_id' => $dataId]);
        return false;
    }

    // Formato: ts=1718712345,v1=abcdef123456...
    preg_match('/ts=(\d+)/', $signature, $tsMatch);
    preg_match('/v1=([a-f0-9]+)/', $signature, $v1Match);

    if (empty($tsMatch) || empty($v1Match)) {
        logError('Webhook: formato de firma inválido', ['signature' => $signature]);
        return false;
    }

    $ts = $tsMatch[1];
    $receivedHash = $v1Match[1];

    // Verificar que el timestamp no tenga más de 5 minutos
    if (abs(time() - (int)$ts) > 300) {
        logError('Webhook: firma expirada', ['ts' => $ts]);
        return false;
    }

    $expectedHash = hash('sha256', $dataId . '.' . $ts . '.' . MP_WEBHOOK_SECRET);

    return hash_equals($expectedHash, $receivedHash);
}

function handleWebhook(): void {
    $input = getJsonInput();

    // MercadoPago envía: { action, api_version, data: { id }, date_created, id, live_mode, type, user_id }
    $type = sanitize($input['type'] ?? '');
    $dataId = $input['data']['id'] ?? null;

    if (!$dataId) {
        // Intentar leer desde query params (otro formato de IPN)
        $dataId = getQueryParam('id');
        $type = getQueryParam('topic');
    }

    if (!$dataId) {
        http_response_code(200);
        echo json_encode(['message' => 'No data']);
        exit;
    }

    // Validar firma del webhook
    if (!validateWebhookSignature((string)$dataId)) {
        logError('MercadoPago Webhook: firma inválida', ['data_id' => $dataId]);
        http_response_code(401);
        echo json_encode(['message' => 'Invalid signature']);
        exit;
    }

    // Log de la notificación recibida
    logError('MercadoPago Webhook received', [
        'type' => $type,
        'data_id' => $dataId,
    ]);

    try {
        if ($type === 'payment') {
            // Obtener información del pago desde la API de MP
            $paymentInfo = getMercadoPagoPaymentInfo($dataId);
        } elseif ($type === 'merchant_order') {
            // Obtener información de la merchant order
            $paymentInfo = getMercadoPagoMerchantOrderInfo($dataId);
        } else {
            $paymentInfo = getMercadoPagoPaymentInfo($dataId);
        }

        if ($paymentInfo && isset($paymentInfo['external_reference'])) {
                $orderId = $paymentInfo['external_reference'];
                $mpPaymentId = $paymentInfo['id'];
                $mpStatus = $paymentInfo['status'];

                $db = Database::getConnection();

                // Actualizar estado de la orden según el pago
                $isCancelled = in_array($mpStatus, ['rejected', 'cancelled', 'refunded', 'charged_back']);
                $orderStatus = match ($mpStatus) {
                    'approved' => 'confirmed',
                    'in_process', 'pending' => 'pending',
                    'rejected', 'cancelled', 'refunded', 'charged_back' => 'cancelled',
                    default => 'pending',
                };

                // Prevenir procesamiento duplicado (MP puede enviar múltiples webhooks)
                $checkStmt = $db->prepare("SELECT status, stock_deducted FROM orders WHERE id = :id");
                $checkStmt->execute([':id' => $orderId]);
                $currentOrder = $checkStmt->fetch();

                if (!$currentOrder) {
                    logError('Webhook: orden no encontrada', ['order_id' => $orderId]);
                    http_response_code(200);
                    echo json_encode(['message' => 'Order not found']);
                    exit;
                }

                // Solo actualizar si el estado cambió (evitar loops por webhooks duplicados)
                if ($currentOrder['status'] === $orderStatus) {
                    http_response_code(200);
                    echo json_encode(['message' => 'Already processed']);
                    exit;
                }

                $stmt = $db->prepare("
                    UPDATE orders
                    SET status = :status, mp_payment_id = :mp_payment_id, mp_status = :mp_status, updated_at = NOW()
                    WHERE id = :id
                ");
                $stmt->execute([
                    ':status' => $orderStatus,
                    ':mp_payment_id' => $mpPaymentId,
                    ':mp_status' => $mpStatus,
                    ':id' => $orderId,
                ]);

                    // ── Pago aprobado: descontar stock + cupón + email ──
                if ($orderStatus === 'confirmed' && $currentOrder['status'] === 'pending') {
                    $itemsStmt = $db->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = :order_id");
                    $itemsStmt->execute([':order_id' => $orderId]);
                    $confirmedItems = $itemsStmt->fetchAll();

                    $deductStmt = $db->prepare("UPDATE products SET stock_count = stock_count - :qty WHERE id = :id");
                    foreach ($confirmedItems as $ci) {
                        $deductStmt->execute([
                            ':qty' => (int)$ci['quantity'],
                            ':id' => $ci['product_id'],
                        ]);
                        $db->exec("UPDATE products SET in_stock = (stock_count > 0) WHERE id = '{$ci['product_id']}'");
                    }

                    // Marcar que el stock ya fue descontado
                    $db->exec("UPDATE orders SET stock_deducted = 1 WHERE id = '$orderId'");

                    // Incrementar uso de cupón si se aplicó
                    $cpStmt = $db->prepare("SELECT coupon_code FROM orders WHERE id = :id AND coupon_code IS NOT NULL");
                    $cpStmt->execute([':id' => $orderId]);
                    $cpRow = $cpStmt->fetch();
                    if ($cpRow) {
                        $db->exec("UPDATE coupons SET used_count = used_count + 1 WHERE code = '{$cpRow['coupon_code']}'");
                    }

                    // Enviar email de confirmación (no bloqueante)
                    $orderData = $db->prepare("SELECT shipping_name, shipping_email, shipping_address, shipping_city, shipping_region, shipping_zip, subtotal, shipping_cost, discount, total, payment_method, coupon_code FROM orders WHERE id = :id");
                    $orderData->execute([':id' => $orderId]);
                    $ord = $orderData->fetch();
                    if ($ord) {
                        try {
                            sendOrderConfirmationEmail(
                                $ord['shipping_email'], $ord['shipping_name'], $orderId, $confirmedItems,
                                (int)$ord['subtotal'], (int)$ord['shipping_cost'], (int)$ord['discount'], (int)$ord['total'],
                                $ord['shipping_address'], $ord['shipping_city'], $ord['shipping_region'], $ord['shipping_zip'],
                                $ord['payment_method'] ?: 'mercadopago', $ord['coupon_code']
                            );
                        } catch (\Throwable $emailErr) {
                            logError('sendOrderConfirmationEmail Error: ' . $emailErr->getMessage(), ['order_id' => $orderId]);
                        }
                    }

                    logError('Stock descontado para orden confirmada', [
                        'order_id' => $orderId,
                        'items' => count($confirmedItems),
                    ]);
                }

                // ── Pago cancelado/rechazado: restaurar stock solo si estaba descontado ──
                if ($isCancelled && $currentOrder['status'] === 'pending') {
                    if ((int)$currentOrder['stock_deducted'] === 1) {
                        $itemsStmt = $db->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = :order_id");
                        $itemsStmt->execute([':order_id' => $orderId]);
                        $cancelledItems = $itemsStmt->fetchAll();

                        $restoreStmt = $db->prepare("UPDATE products SET stock_count = stock_count + :qty WHERE id = :id");
                        foreach ($cancelledItems as $ci) {
                            $restoreStmt->execute([
                                ':qty' => (int)$ci['quantity'],
                                ':id' => $ci['product_id'],
                            ]);
                            $db->exec("UPDATE products SET in_stock = (stock_count > 0) WHERE id = '{$ci['product_id']}'");
                        }

                        logError('Stock restaurado para orden cancelada', [
                            'order_id' => $orderId,
                            'mp_status' => $mpStatus,
                            'items_restored' => count($cancelledItems),
                        ]);
                    } else {
                        logError('Orden cancelada sin stock que restaurar', [
                            'order_id' => $orderId,
                            'mp_status' => $mpStatus,
                        ]);
                    }
                }
        }

        http_response_code(200);
        echo json_encode(['message' => 'OK']);

    } catch (\Throwable $e) {
        logError('MercadoPago Webhook Error: ' . $e->getMessage(), ['data_id' => $dataId]);
        http_response_code(200);
        echo json_encode(['message' => 'Error processing']);
    }
}

// =============================================================
// POST /api/mercado-pago/confirm-payment
// Endpoint de respaldo llamado desde CheckoutSuccess
// Verifica el estado del pago en MP y procesa la orden si está aprobada
// =============================================================

function confirmPayment(): void {
    $db = Database::getConnection();
    $input = getJsonInput();

    $orderId = sanitize($input['order_id'] ?? '');
    $paymentId = sanitize($input['payment_id'] ?? '');

    if (!$orderId && !$paymentId) {
        errorResponse('Se requiere order_id o payment_id', 400);
    }

    try {
        // Buscar orden por ID o por mp_payment_id
        $order = null;
        if ($orderId) {
            $stmt = $db->prepare("SELECT * FROM orders WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $orderId]);
            $order = $stmt->fetch();
        }
        if (!$order && $paymentId) {
            $stmt = $db->prepare("SELECT * FROM orders WHERE mp_payment_id = :mp_id LIMIT 1");
            $stmt->execute([':mp_id' => $paymentId]);
            $order = $stmt->fetch();
        }

        if (!$order) {
            logError('confirmPayment: orden no encontrada', [
                'order_id' => $orderId,
                'payment_id' => $paymentId,
            ]);
            successResponse(['processed' => false, 'message' => 'Orden no encontrada']);
            return;
        }

        // Si ya fue procesada, no hacer nada
        if ($order['status'] === 'confirmed') {
            logError('confirmPayment: orden ya confirmada', ['order_id' => $order['id']]);
            successResponse([
                'processed' => false,
                'message' => 'Orden ya confirmada',
                'order_id' => $order['id'],
                'status' => $order['status'],
            ]);
            return;
        }

        if ($order['status'] !== 'pending') {
            successResponse([
                'processed' => false,
                'message' => 'Orden en estado ' . $order['status'] . ', no se puede confirmar',
                'order_id' => $order['id'],
                'status' => $order['status'],
            ]);
            return;
        }

        // Consultar MP para verificar el estado real del pago
        $mpStatus = null;
        $mpPaymentId = null;

        configureMercadoPago();

        // Usar payment_id de la URL (viene en redirect de MP)
        if ($paymentId) {
            try {
                $client = new \MercadoPago\Client\Payment\PaymentClient();
                $payment = $client->get($paymentId);
                if ($payment) {
                    $mpStatus = $payment->status;
                    $mpPaymentId = $payment->id;
                    logError('confirmPayment: payment verificado por ID', [
                        'payment_id' => $paymentId,
                        'status' => $mpStatus,
                    ]);
                }
            } catch (\Throwable $e) {
                logError('confirmPayment: error consultando MP por payment_id', [
                    'error' => $e->getMessage(),
                    'payment_id' => $paymentId,
                ]);
            }
        }

        // Si no hay payment_id en la URL, buscar por mp_preference_id
        if (!$mpStatus && $paymentId === '' && $order['mp_preference_id']) {
            try {
                $client = new \MercadoPago\Client\Payment\PaymentClient();
                $payment = $client->get($order['mp_preference_id']);
                if ($payment) {
                    $mpStatus = $payment->status;
                    $mpPaymentId = $payment->id;
                }
            } catch (\Throwable $e) {
                logError('confirmPayment: error consultando MP por preference_id', [
                    'error' => $e->getMessage(),
                    'preference_id' => $order['mp_preference_id'],
                ]);
            }
        }

        if (!$mpStatus) {
            successResponse([
                'processed' => false,
                'message' => 'No se pudo verificar el estado del pago en MercadoPago',
                'order_id' => $order['id'],
                'status' => $order['status'],
            ]);
            return;
        }

        logError('confirmPayment: estado de pago MP', [
            'order_id' => $order['id'],
            'mp_status' => $mpStatus,
            'mp_payment_id' => $mpPaymentId,
        ]);

        // Si el pago no está aprobado, actualizar estado pero no procesar
        if ($mpStatus !== 'approved') {
            $newStatus = match ($mpStatus) {
                'rejected', 'cancelled', 'refunded', 'charged_back' => 'cancelled',
                default => 'pending',
            };
            $stmt = $db->prepare("UPDATE orders SET status = :status, mp_payment_id = :mp_id, mp_status = :mp_status, updated_at = NOW() WHERE id = :id");
            $stmt->execute([
                ':status' => $newStatus,
                ':mp_id' => $mpPaymentId,
                ':mp_status' => $mpStatus,
                ':id' => $order['id'],
            ]);
            successResponse([
                'processed' => false,
                'message' => 'Pago en estado: ' . $mpStatus,
                'order_id' => $order['id'],
                'status' => $newStatus,
            ]);
            return;
        }

        // ── Pago aprobado: procesar orden ──
        logError('confirmPayment: procesando orden confirmada desde frontend', ['order_id' => $order['id']]);

        $itemsStmt = $db->prepare("SELECT product_id, product_name, product_price, quantity, line_total FROM order_items WHERE order_id = :order_id");
        $itemsStmt->execute([':order_id' => $order['id']]);
        $confirmedItems = $itemsStmt->fetchAll();

        $deductStmt = $db->prepare("UPDATE products SET stock_count = stock_count - :qty WHERE id = :id");
        foreach ($confirmedItems as $ci) {
            $deductStmt->execute([':qty' => (int)$ci['quantity'], ':id' => $ci['product_id']]);
            $db->exec("UPDATE products SET in_stock = (stock_count > 0) WHERE id = '{$ci['product_id']}'");
        }

        $stmt = $db->prepare("UPDATE orders SET status = 'confirmed', mp_payment_id = :mp_id, mp_status = :mp_status, stock_deducted = 1, updated_at = NOW() WHERE id = :id");
        $stmt->execute([
            ':mp_id' => $mpPaymentId,
            ':mp_status' => $mpStatus,
            ':id' => $order['id'],
        ]);

        // Incrementar cupón si aplica
        if ($order['coupon_code']) {
            $db->exec("UPDATE coupons SET used_count = used_count + 1 WHERE code = '{$order['coupon_code']}'");
        }

        // Enviar email
        try {
            sendOrderConfirmationEmail(
                $order['shipping_email'], $order['shipping_name'], $order['id'], $confirmedItems,
                (int)$order['subtotal'], (int)$order['shipping_cost'], (int)$order['discount'], (int)$order['total'],
                $order['shipping_address'], $order['shipping_city'], $order['shipping_region'], $order['shipping_zip'],
                $order['payment_method'] ?: 'mercadopago', $order['coupon_code']
            );
            logError('confirmPayment: email de confirmación enviado', ['order_id' => $order['id']]);
        } catch (\Throwable $e) {
            logError('confirmPayment: sendOrderConfirmationEmail Error: ' . $e->getMessage(), [
                'order_id' => $order['id'],
                'trace' => $e->getTraceAsString(),
            ]);
        }

        successResponse([
            'processed' => true,
            'message' => 'Orden confirmada exitosamente',
            'order_id' => $order['id'],
            'status' => 'confirmed',
        ]);

    } catch (\Throwable $e) {
        logError('confirmPayment Error: ' . $e->getMessage(), [
            'order_id' => $orderId ?? '',
            'payment_id' => $paymentId ?? '',
            'trace' => $e->getTraceAsString(),
        ]);
        errorResponse('Error al confirmar pago', 500);
    }
}

// =============================================================
// Consultar información de pago en MercadoPago
// =============================================================

function getMercadoPagoPaymentInfo(string $paymentId): ?array {
    configureMercadoPago();
    $client = new \MercadoPago\Client\Payment\PaymentClient();

    try {
        $payment = $client->get($paymentId);
        return [
            'id' => $payment->id,
            'status' => $payment->status,
            'status_detail' => $payment->status_detail,
            'external_reference' => $payment->external_reference,
            'transaction_amount' => $payment->transaction_amount,
            'payment_method_id' => $payment->payment_method_id,
            'payer' => [
                'email' => $payment->payer->email ?? null,
            ],
        ];
    } catch (MPApiException $e) {
        logError('MercadoPago getPayment Error', [
            'payment_id' => $paymentId,
            'response' => $e->getApiResponse()->getContent(),
        ]);
        return null;
    } catch (\Throwable $e) {
        logError('MercadoPago getPayment Exception: ' . $e->getMessage(), ['payment_id' => $paymentId]);
        return null;
    }
}

// =============================================================
// Consultar merchant order en MercadoPago
// (para webhooks de tipo merchant_order)
// =============================================================

function getMercadoPagoMerchantOrderInfo(string $merchantOrderId): ?array {
    configureMercadoPago();
    $client = new \MercadoPago\Client\MerchantOrder\MerchantOrderClient();

    try {
        $order = $client->get((int)$merchantOrderId);
        $payments = $order->payments ?? [];
        $firstPayment = !empty($payments) ? $payments[0] : null;

        return [
            'id' => $order->id,
            'status' => $firstPayment ? $firstPayment->status : $order->status,
            'external_reference' => $order->external_reference,
            'transaction_amount' => $order->total_amount,
            'payment_method_id' => $firstPayment ? ($firstPayment->operation_type ?? null) : null,
            'payer' => [
                'email' => $order->payer->email ?? null,
            ],
            'is_merchant_order' => true,
        ];
    } catch (MPApiException $e) {
        logError('MercadoPago getMerchantOrder Error', [
            'merchant_order_id' => $merchantOrderId,
            'response' => $e->getApiResponse()->getContent(),
        ]);
        return null;
    } catch (\Throwable $e) {
        logError('MercadoPago getMerchantOrder Exception: ' . $e->getMessage(), ['merchant_order_id' => $merchantOrderId]);
        return null;
    }
}
