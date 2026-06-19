<?php
// =============================================================
// Wishlist API — persistir favoritos en BD para usuarios autenticados
// =============================================================

function listWishlist(): void {
    $user = requireAuth();
    $userId = $user['id'];
    $db = Database::getConnection();

    $stmt = $db->prepare("
        SELECT w.product_id, w.created_at
        FROM wishlist_items w
        WHERE w.user_id = :uid
        ORDER BY w.created_at DESC
    ");
    $stmt->execute([':uid' => $userId]);
    $items = $stmt->fetchAll();

    $productIds = array_map(fn($i) => $i['product_id'], $items);

    if (empty($productIds)) {
        successResponse([]);
        return;
    }

    $placeholders = implode(',', array_fill(0, count($productIds), '?'));
    $stmt = $db->prepare("
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id IN ($placeholders)
    ");
    $stmt->execute($productIds);
    $products = $stmt->fetchAll();

    foreach ($products as &$p) {
        $p['tags'] = json_decode($p['tags'] ?? '[]', true) ?? [];
        $p['features'] = json_decode($p['features'] ?? '[]', true) ?? [];
        $p['images'] = json_decode($p['images'] ?? '[]', true) ?? [];
        $p['in_stock'] = (bool)$p['in_stock'];
        $p['is_featured'] = (bool)$p['is_featured'];
        $p['price'] = (int)$p['price'];
        $p['original_price'] = $p['original_price'] ? (int)$p['original_price'] : null;
        $p['rating'] = (float)$p['rating'];
        $p['stock_count'] = (int)$p['stock_count'];
    }

    successResponse($products);
}

function addToWishlist(): void {
    $user = requireAuth();
    $userId = $user['id'];
    $db = Database::getConnection();
    $input = getJsonInput();

    $productId = sanitize($input['product_id'] ?? '');
    if (!$productId) errorResponse('product_id requerido');

    $stmt = $db->prepare("SELECT id FROM products WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $productId]);
    if (!$stmt->fetch()) {
        errorResponse('Producto no encontrado', 404);
    }

    $stmt = $db->prepare("
        INSERT IGNORE INTO wishlist_items (user_id, product_id)
        VALUES (:uid, :pid)
    ");
    $stmt->execute([':uid' => $userId, ':pid' => $productId]);

    successResponse(['product_id' => $productId], 'Agregado a favoritos');
}

function removeFromWishlist(): void {
    $user = requireAuth();
    $userId = $user['id'];
    $db = Database::getConnection();
    $input = getJsonInput();

    $productId = sanitize($input['product_id'] ?? '');
    if (!$productId) errorResponse('product_id requerido');

    $stmt = $db->prepare("
        DELETE FROM wishlist_items
        WHERE user_id = :uid AND product_id = :pid
    ");
    $stmt->execute([':uid' => $userId, ':pid' => $productId]);

    successResponse(['product_id' => $productId], 'Eliminado de favoritos');
}
