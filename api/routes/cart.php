<?php
// =============================================================
// Cart API — persistir carrito en BD para usuarios autenticados
// =============================================================

function listCart(): void {
    $user = requireAuth();
    $userId = $user['id'];
    $db = Database::getConnection();

    $stmt = $db->prepare("
        SELECT c.product_id, c.quantity, c.updated_at,
               p.*, cat.name as category_name, cat.slug as category_slug
        FROM cart_items c
        JOIN products p ON p.id = c.product_id
        LEFT JOIN categories cat ON p.category_id = cat.id
        WHERE c.user_id = :uid
        ORDER BY c.updated_at DESC
    ");
    $stmt->execute([':uid' => $userId]);
    $items = $stmt->fetchAll();

    $cart = [];
    foreach ($items as &$item) {
        $item['quantity'] = (int)$item['quantity'];
        $item['tags'] = json_decode($item['tags'] ?? '[]', true) ?? [];
        $item['features'] = json_decode($item['features'] ?? '[]', true) ?? [];
        $item['images'] = json_decode($item['images'] ?? '[]', true) ?? [];
        $item['in_stock'] = (bool)$item['in_stock'];
        $item['is_featured'] = (bool)$item['is_featured'];
        $item['price'] = (int)$item['price'];
        $item['original_price'] = $item['original_price'] ? (int)$item['original_price'] : null;
        $item['rating'] = (float)$item['rating'];
        $item['stock_count'] = (int)$item['stock_count'];
        $cart[] = $item;
    }

    successResponse($cart);
}

function syncCart(): void {
    $user = requireAuth();
    $userId = $user['id'];
    $db = Database::getConnection();
    $input = getJsonInput();

    $items = $input['items'] ?? [];
    if (!is_array($items)) {
        errorResponse('items debe ser un array');
    }

    $db->beginTransaction();
    try {
        // Eliminar todos los items actuales del usuario
        $db->prepare("DELETE FROM cart_items WHERE user_id = :uid")
           ->execute([':uid' => $userId]);

        if (!empty($items)) {
            $stmt = $db->prepare("
                INSERT INTO cart_items (id, user_id, product_id, quantity)
                VALUES (:id, :uid, :pid, :qty)
                ON DUPLICATE KEY UPDATE quantity = :qty2
            ");

            foreach ($items as $item) {
                $productId = sanitize($item['product_id'] ?? '');
                $quantity = min((int)($item['quantity'] ?? 1), 99);

                if (!$productId || $quantity < 1) continue;

                $stmt->execute([
                    ':id' => generateUUID(),
                    ':uid' => $userId,
                    ':pid' => $productId,
                    ':qty' => $quantity,
                    ':qty2' => $quantity,
                ]);
            }
        }

        $db->commit();
        successResponse(null, 'Carrito sincronizado');
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}
