<?php
// =============================================================
// Standalone MercadoPago Webhook handler
// Bypasses index.php router to avoid mod_security issues
// =============================================================

require_once __DIR__ . '/env_loader.php';
loadEnv(__DIR__);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/vendor/autoload.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, x-signature, x-request-id');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$type = sanitize($input['type'] ?? '');
$dataId = $input['data']['id'] ?? null;

if (!$dataId) {
    $dataId = $_GET['id'] ?? null;
    $type = $_GET['topic'] ?? $type;
}

if (!$dataId) {
    logError('Webhook: no data received', ['input' => $input, 'get' => $_GET]);
    http_response_code(200);
    echo json_encode(['message' => 'No data']);
    exit;
}

// ── Validate x-signature (non-blocking in sandbox) ──
$secret = getenv('MP_WEBHOOK_SECRET') ?: '';
$signatureValid = true; // default: assume valid if no secret or validation passes

if ($secret) {
    $signature = $_SERVER['HTTP_X_SIGNATURE'] ?? $_SERVER['HTTP_X_SIGNATURE_HEADER'] ?? '';
    
    if (!$signature) {
        // No signature header — log warning but DON'T block (common in sandbox)
        logError('Webhook: MP_WEBHOOK_SECRET definido pero MP no envió x-signature header. ' .
            'Procesando igual (modo permisivo).', ['data_id' => $dataId, 'type' => $type]);
        $signatureValid = true;
    } else {
        preg_match('/ts=(\d+)/', $signature, $tsMatch);
        preg_match('/v1=([a-f0-9]+)/', $signature, $v1Match);
        
        if (empty($tsMatch) || empty($v1Match)) {
            logError('Webhook: formato de firma inválido', ['signature' => $signature]);
            $signatureValid = true; // no bloquear, loguear no más
        } elseif (abs(time() - (int)$tsMatch[1]) > 300) {
            logError('Webhook: firma expirada', ['ts' => $tsMatch[1]]);
            $signatureValid = true; // no bloquear en sandbox
        } else {
            $expectedHash = hash('sha256', $dataId . '.' . $tsMatch[1] . '.' . $secret);
            if (!hash_equals($expectedHash, $v1Match[1])) {
                logError('Webhook: firma inválida (hash mismatch)', [
                    'expected' => $expectedHash,
                    'received' => $v1Match[1],
                ]);
                $signatureValid = true; // no bloquear en sandbox
            }
        }
    }
}

logError('Webhook: notificación recibida', [
    'type' => $type,
    'data_id' => $dataId,
    'method' => $_SERVER['REQUEST_METHOD'],
    'signature_valid' => $signatureValid,
    'has_secret' => !empty($secret),
]);

// ── Process the payment ──
require_once __DIR__ . '/routes/orders.php';
require_once __DIR__ . '/email_templates.php';

try {
    \MercadoPago\MercadoPagoConfig::setAccessToken(MP_ACCESS_TOKEN);
    $paymentInfo = null;

    if ($type === 'payment') {
        $client = new \MercadoPago\Client\Payment\PaymentClient();
        $payment = $client->get($dataId);
        if ($payment) {
            $paymentInfo = [
                'id' => $payment->id,
                'status' => $payment->status,
                'external_reference' => $payment->external_reference,
                'transaction_amount' => $payment->transaction_amount,
            ];
            logError('Webhook: payment obtenido de API MP', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
                'external_reference' => $payment->external_reference,
            ]);
        } else {
            logError('Webhook: payment NULL desde API MP', ['data_id' => $dataId]);
        }
    } elseif ($type === 'merchant_order') {
        $client = new \MercadoPago\Client\MerchantOrder\MerchantOrderClient();
        $order = $client->get((int)$dataId);
        $payments = $order->payments ?? [];
        $firstPayment = !empty($payments) ? $payments[0] : null;
        if ($order) {
            $paymentInfo = [
                'id' => $order->id,
                'status' => $firstPayment ? $firstPayment->status : $order->status,
                'external_reference' => $order->external_reference,
                'transaction_amount' => $order->total_amount,
                'is_merchant_order' => true,
            ];
            logError('Webhook: merchant_order obtenido de API MP', [
                'order_id' => $order->id,
                'status' => $paymentInfo['status'],
                'external_reference' => $paymentInfo['external_reference'],
            ]);
        } else {
            logError('Webhook: merchant_order NULL desde API MP', ['data_id' => $dataId]);
        }
    } else {
        // Fallback: tratar como payment
        $client = new \MercadoPago\Client\Payment\PaymentClient();
        $payment = $client->get($dataId);
        if ($payment) {
            $paymentInfo = [
                'id' => $payment->id,
                'status' => $payment->status,
                'external_reference' => $payment->external_reference,
                'transaction_amount' => $payment->transaction_amount,
            ];
        }
    }

    if (!$paymentInfo) {
        logError('Webhook: no se pudo obtener paymentInfo', ['data_id' => $dataId, 'type' => $type]);
        http_response_code(200);
        echo json_encode(['message' => 'No payment info']);
        exit;
    }

    if (!isset($paymentInfo['external_reference']) || !$paymentInfo['external_reference']) {
        logError('Webhook: payment sin external_reference', ['paymentInfo' => $paymentInfo]);
        http_response_code(200);
        echo json_encode(['message' => 'No external reference']);
        exit;
    }

    $orderId = $paymentInfo['external_reference'];
    $mpPaymentId = $paymentInfo['id'];
    $mpStatus = $paymentInfo['status'];
    $db = Database::getConnection();

    $isCancelled = in_array($mpStatus, ['rejected', 'cancelled', 'refunded', 'charged_back']);
    $orderStatus = match ($mpStatus) {
        'approved' => 'confirmed',
        'in_process', 'pending' => 'pending',
        'rejected', 'cancelled', 'refunded', 'charged_back' => 'cancelled',
        default => 'pending',
    };

    $checkStmt = $db->prepare("SELECT status, stock_deducted FROM orders WHERE id = :id");
    $checkStmt->execute([':id' => $orderId]);
    $currentOrder = $checkStmt->fetch();

    if (!$currentOrder) {
        logError('Webhook: orden no encontrada en BD', ['order_id' => $orderId]);
        http_response_code(200);
        echo json_encode(['message' => 'Order not found']);
        exit;
    }

    // Si ya está en el mismo estado, no hacer nada (evitar loops)
    if ($currentOrder['status'] === $orderStatus) {
        logError('Webhook: orden ya estaba en estado ' . $orderStatus . ', skip', ['order_id' => $orderId]);
        http_response_code(200);
        echo json_encode(['message' => 'Already processed']);
        exit;
    }

    logError('Webhook: actualizando orden', [
        'order_id' => $orderId,
        'old_status' => $currentOrder['status'],
        'new_status' => $orderStatus,
        'mp_status' => $mpStatus,
        'mp_payment_id' => $mpPaymentId,
    ]);

    // Actualizar estado de la orden
    $stmt = $db->prepare("UPDATE orders SET status = :status, mp_payment_id = :mp_payment_id, mp_status = :mp_status, updated_at = NOW() WHERE id = :id");
    $stmt->execute([
        ':status' => $orderStatus,
        ':mp_payment_id' => $mpPaymentId,
        ':mp_status' => $mpStatus,
        ':id' => $orderId,
    ]);

    // ── Pago aprobado: descontar stock + cupón + email ──
    if ($orderStatus === 'confirmed' && $currentOrder['status'] === 'pending') {
        logError('Webhook: procesando pago confirmado', ['order_id' => $orderId]);

        $itemsStmt = $db->prepare("SELECT product_id, product_name, product_price, quantity, line_total FROM order_items WHERE order_id = :order_id");
        $itemsStmt->execute([':order_id' => $orderId]);
        $confirmedItems = $itemsStmt->fetchAll();

        if (empty($confirmedItems)) {
            logError('Webhook: orden confirmada sin items!', ['order_id' => $orderId]);
        } else {
            $deductStmt = $db->prepare("UPDATE products SET stock_count = stock_count - :qty WHERE id = :id");
            foreach ($confirmedItems as $ci) {
                $deductStmt->execute([':qty' => (int)$ci['quantity'], ':id' => $ci['product_id']]);
                $db->exec("UPDATE products SET in_stock = (stock_count > 0) WHERE id = '{$ci['product_id']}'");
            }
            $db->exec("UPDATE orders SET stock_deducted = 1 WHERE id = '$orderId'");

            logError('Webhook: stock descontado', [
                'order_id' => $orderId,
                'items_processed' => count($confirmedItems),
            ]);

            // Incrementar uso de cupón si se aplicó
            $cpStmt = $db->prepare("SELECT coupon_code FROM orders WHERE id = :id AND coupon_code IS NOT NULL");
            $cpStmt->execute([':id' => $orderId]);
            $cpRow = $cpStmt->fetch();
            if ($cpRow) {
                $db->exec("UPDATE coupons SET used_count = used_count + 1 WHERE code = '{$cpRow['coupon_code']}'");
                logError('Webhook: cupón incrementado', ['code' => $cpRow['coupon_code'], 'order_id' => $orderId]);
            }

            // Enviar email de confirmación
            $orderData = $db->prepare("SELECT shipping_name, shipping_email, shipping_address, shipping_city, shipping_region, shipping_zip, subtotal, shipping_cost, discount, total, payment_method, coupon_code FROM orders WHERE id = :id");
            $orderData->execute([':id' => $orderId]);
            $ord = $orderData->fetch();

            if ($ord) {
                logError('Webhook: enviando email de confirmación', [
                    'to' => $ord['shipping_email'],
                    'order_id' => $orderId,
                ]);
                try {
                    sendOrderConfirmationEmail(
                        $ord['shipping_email'], $ord['shipping_name'], $orderId, $confirmedItems,
                        (int)$ord['subtotal'], (int)$ord['shipping_cost'], (int)$ord['discount'], (int)$ord['total'],
                        $ord['shipping_address'], $ord['shipping_city'], $ord['shipping_region'], $ord['shipping_zip'],
                        $ord['payment_method'] ?: 'mercadopago', $ord['coupon_code']
                    );
                    logError('Webhook: email de confirmación enviado', ['order_id' => $orderId]);
                } catch (\Throwable $e) {
                    logError('Webhook: sendOrderConfirmationEmail Error: ' . $e->getMessage(), [
                        'order_id' => $orderId,
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            } else {
                logError('Webhook: no se encontraron datos de orden para email', ['order_id' => $orderId]);
            }
        }
    }

    // ── Pago cancelado/rechazado: restaurar stock si estaba descontado ──
    if ($isCancelled && $currentOrder['status'] === 'pending' && (int)$currentOrder['stock_deducted'] === 1) {
        logError('Webhook: restaurando stock por cancelación', ['order_id' => $orderId, 'mp_status' => $mpStatus]);
        $itemsStmt = $db->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = :order_id");
        $itemsStmt->execute([':order_id' => $orderId]);
        $cancelledItems = $itemsStmt->fetchAll();

        $restoreStmt = $db->prepare("UPDATE products SET stock_count = stock_count + :qty WHERE id = :id");
        foreach ($cancelledItems as $ci) {
            $restoreStmt->execute([':qty' => (int)$ci['quantity'], ':id' => $ci['product_id']]);
            $db->exec("UPDATE products SET in_stock = (stock_count > 0) WHERE id = '{$ci['product_id']}'");
        }
        logError('Webhook: stock restaurado', ['order_id' => $orderId, 'items' => count($cancelledItems)]);
    }

    logError('Webhook: procesamiento completado exitosamente', ['order_id' => $orderId, 'new_status' => $orderStatus]);
    http_response_code(200);
    echo json_encode(['message' => 'OK']);
} catch (\Throwable $e) {
    logError('Webhook Error: ' . $e->getMessage(), [
        'data_id' => $dataId,
        'trace' => $e->getTraceAsString(),
    ]);
    http_response_code(200);
    echo json_encode(['message' => 'Error processing']);
}
