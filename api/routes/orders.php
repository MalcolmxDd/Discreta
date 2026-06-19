<?php
// =============================================================
// Orders API
// =============================================================

require_once __DIR__ . '/../email_templates.php';

function createOrder(): void {
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

    // Calcular subtotal desde BD (no confiar en precios del cliente)
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

    // Calcular costo de envío por región
    $extremeRegions = ['Región de Magallanes', 'Región de Aysén', 'Región de Arica y Parinacota'];
    if (in_array($region, $extremeRegions)) {
        $shippingCost = 3990;
    } elseif ($region === 'Región Metropolitana') {
        $shippingCost = 0;
    } else {
        $shippingCost = 5990;
    }

    // Validar cupón desde BD
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

        // Insertar orden (mantener compatibilidad: sin MP = método manual)
        $paymentMethod = $input['payment_method'] ?? null;
        $stmt = $db->prepare("
            INSERT INTO orders (id, user_id, status, subtotal, shipping_cost, total,
                               shipping_name, shipping_email, shipping_phone, shipping_address, shipping_city, shipping_zip,
                               payment_method, created_at, updated_at)
            VALUES (:id, :user_id, 'pending', :subtotal, :shipping_cost, :total,
                    :name, :email, :phone, :address, :city, :zip,
                    :payment_method, NOW(), NOW())
        ");
        $stmt->execute([
            ':id' => $orderId,
            ':user_id' => $userId,
            ':subtotal' => $subtotal,
            ':shipping_cost' => $shippingCost,
            ':total' => $total,
            ':name' => $name,
            ':email' => $email,
            ':phone' => $phone ?: null,
            ':address' => $address,
            ':city' => $city,
            ':zip' => $zip,
            ':payment_method' => $paymentMethod,
        ]);

        // Insertar items y actualizar stock
        $itemStmt = $db->prepare("
            INSERT INTO order_items (id, order_id, product_id, product_name, product_price, quantity, line_total)
            VALUES (:id, :order_id, :product_id, :product_name, :product_price, :quantity, :line_total)
        ");
        $stockStmt = $db->prepare("UPDATE products SET stock_count = stock_count - :qty WHERE id = :id");

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

            // Actualizar stock y auto-marcar como agotado si llega a 0
            $stockStmt->execute([
                ':qty' => $oi['quantity'],
                ':id' => $oi['product_id'],
            ]);
            $db->exec("UPDATE products SET in_stock = (stock_count > 0) WHERE id = '{$oi['product_id']}'");
        }

        $db->commit();

        // Incrementar uso de cupón si se aplicó
        if ($appliedCoupon) {
            $db->exec("UPDATE coupons SET used_count = used_count + 1 WHERE code = '$appliedCoupon'");
        }

        // Enviar email de confirmación (no bloqueante — ignorar errores)
        sendOrderConfirmationEmail($email, $name, $orderId, $orderItems, $subtotal, $shippingCost, $discount, $total, $address, $city, $region, $zip, $paymentMethod ?: 'manual', $appliedCoupon);

        successResponse([
            'order_id' => $orderId,
            'total' => $total,
            'subtotal' => $subtotal,
            'shipping_cost' => $shippingCost,
            'discount' => $discount,
            'items_count' => count($orderItems),
        ], 'Orden creada exitosamente');

    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}


function trackOrder(): void {
    $db = Database::getConnection();
    
    $email = sanitize(getQueryParam('email', ''));
    $orderId = sanitize(getQueryParam('order', ''));
    
    if (!validateEmail($email)) {
        errorResponse('Email inválido');
    }
    
    $where = 'o.shipping_email = :email';
    $params = [':email' => $email];
    
    if ($orderId) {
        $where .= ' AND o.id = :order_id';
        $params[':order_id'] = $orderId;
    }
    
    $stmt = $db->prepare("
        SELECT 
            o.id, o.status, o.subtotal, o.shipping_cost, o.total,
            o.shipping_name, o.shipping_email, o.shipping_address,
            o.shipping_city, o.created_at
        FROM orders o
        WHERE $where
        ORDER BY o.created_at DESC
    ");
    $stmt->execute($params);
    $orders = $stmt->fetchAll();
    
    if (empty($orders)) {
        successResponse([], 'No se encontraron órdenes para este email');
        return;
    }
    
    foreach ($orders as &$order) {
        // Obtener items de cada orden
        $itemStmt = $db->prepare("
            SELECT id, product_id, product_name, product_price, quantity, line_total
            FROM order_items
            WHERE order_id = :order_id
        ");
        $itemStmt->execute([':order_id' => $order['id']]);
        $items = $itemStmt->fetchAll();
        
        foreach ($items as &$item) {
            $item['product_price'] = (int)$item['product_price'];
            $item['quantity'] = (int)$item['quantity'];
            $item['line_total'] = (int)$item['line_total'];
        }
        
        $order['items'] = $items;
        $order['subtotal'] = (int)$order['subtotal'];
        $order['shipping_cost'] = (int)$order['shipping_cost'];
        $order['total'] = (int)$order['total'];
    }
    
    successResponse($orders);
}


