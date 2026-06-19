<?php
// =============================================================
// Admin API — CRUD productos, categorías, dashboard stats
// Todos los endpoints requieren auth con role=admin
// =============================================================

require_once __DIR__ . '/../email_templates.php';

// =============================================================
// PRODUCTOS
// =============================================================

function adminCreateProduct(): void {
    requireAdmin();
    $db = Database::getConnection();
    $input = getJsonInput();

    $id = sanitize($input['id'] ?? '');
    $name = sanitize($input['name'] ?? '');
    $slug = sanitize($input['slug'] ?? '');
    $price = (int)($input['price'] ?? 0);

    if (!$name || !$price) {
        errorResponse('Nombre y precio son requeridos');
    }

    if (!$id) {
        $id = generateUUID();
    }

    $stmt = $db->prepare("SELECT id FROM products WHERE id = :id OR slug = :slug LIMIT 1");
    $stmt->execute([':id' => $id, ':slug' => $slug]);
    if ($stmt->fetch()) {
        errorResponse('Ya existe un producto con ese ID o slug', 409);
    }

    // Obtener imágenes: images[] es el array completo; image se deriva de images[0]
    $images = isset($input['images']) && is_array($input['images'])
        ? $input['images']
        : [];
    $image = $images[0] ?? '';

    $stmt = $db->prepare("
        INSERT INTO products (id, name, slug, description, long_description, price, original_price, 
                             image, images, gradient, category_id, tags, rating, in_stock, stock_count, features, is_featured)
        VALUES (:id, :name, :slug, :desc, :long_desc, :price, :orig_price, 
                :image, :images, :gradient, :category_id, :tags, :rating, :in_stock, :stock_count, :features, :is_featured)
    ");
    $stmt->execute([
        ':id' => $id,
        ':name' => $name,
        ':slug' => $slug,
        ':desc' => sanitize($input['description'] ?? ''),
        ':long_desc' => sanitize($input['longDescription'] ?? ''),
        ':price' => $price,
        ':orig_price' => !empty($input['originalPrice']) ? (int)$input['originalPrice'] : null,
        ':image' => $image,
        ':images' => json_encode($images, JSON_UNESCAPED_UNICODE),
        ':gradient' => sanitize($input['gradient'] ?? ''),
        ':category_id' => sanitize($input['category'] ?? ''),
        ':tags' => json_encode($input['tags'] ?? [], JSON_UNESCAPED_UNICODE),
        ':rating' => (float)($input['rating'] ?? 0),
        ':in_stock' => ($input['inStock'] ?? true) ? 1 : 0,
        ':stock_count' => (int)($input['stockCount'] ?? 0),
        ':features' => json_encode($input['features'] ?? [], JSON_UNESCAPED_UNICODE),
        ':is_featured' => !empty($input['isFeatured']) ? 1 : 0,
    ]);

    successResponse(['id' => $id], 'Producto creado exitosamente');
}

function adminUpdateProduct(): void {
    requireAdmin();
    $db = Database::getConnection();
    $input = getJsonInput();

    $id = sanitize($input['id'] ?? '');
    if (!$id) errorResponse('ID de producto requerido');

    // Verificar que existe
    $stmt = $db->prepare("SELECT id FROM products WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetch()) {
        errorResponse('Producto no encontrado', 404);
    }

    // Derivar image desde images[0] si viene el array
    if (isset($input['images']) && is_array($input['images'])) {
        $input['image'] = $input['images'][0] ?? '';
    }

    $fields = [];
    $params = [':id' => $id];

    $map = [
        'name' => 'name', 'slug' => 'slug', 'description' => 'description',
        'longDescription' => 'long_description', 'price' => 'price',
        'originalPrice' => 'original_price', 'image' => 'image',
        'images' => 'images', 'gradient' => 'gradient', 'category' => 'category_id',
        'tags' => 'tags', 'features' => 'features',
        'rating' => 'rating', 'inStock' => 'in_stock',
        'stockCount' => 'stock_count',
        'isFeatured' => 'is_featured',
    ];

    foreach ($map as $inputKey => $dbColumn) {
        if (isset($input[$inputKey])) {
            $fields[] = "$dbColumn = :$inputKey";
            $val = $input[$inputKey];

            if (in_array($inputKey, ['tags', 'features', 'images']) && is_array($val)) {
                $val = json_encode($val, JSON_UNESCAPED_UNICODE);
            }
            if (in_array($inputKey, ['inStock', 'isFeatured'])) {
                $val = $val ? 1 : 0;
            }
            if (in_array($inputKey, ['price', 'originalPrice', 'stockCount'])) {
                $val = (int)$val;
            }
            if ($inputKey === 'rating') {
                $val = (float)$val;
            }

            $params[":$inputKey"] = $val;
        }
    }

    if (empty($fields)) {
        successResponse(null, 'Sin cambios');
    }

    $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    successResponse(['id' => $id], 'Producto actualizado exitosamente');
}

function adminDeleteProduct(): void {
    requireAdmin();
    $db = Database::getConnection();

    $id = getQueryParam('id');
    if (!$id) {
        $input = getJsonInput();
        $id = $input['id'] ?? '';
    }

    if (!$id) errorResponse('ID de producto requerido');

    $stmt = $db->prepare("DELETE FROM products WHERE id = :id");
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        errorResponse('Producto no encontrado', 404);
    }

    successResponse(null, 'Producto eliminado exitosamente');
}

// =============================================================
// CATEGORÍAS
// =============================================================

function adminCreateCategory(): void {
    requireAdmin();
    $db = Database::getConnection();
    $input = getJsonInput();

    $id = sanitize($input['id'] ?? '');
    $name = sanitize($input['name'] ?? '');

    if (!$name) errorResponse('Nombre requerido');

    $slug = sanitize($input['slug'] ?? '');
    if (!$slug) $slug = strtolower(preg_replace('/[^a-zA-Z0-9\-]/', '-', $name));

    $stmt = $db->prepare("SELECT id FROM categories WHERE id = :id OR slug = :slug LIMIT 1");
    $stmt->execute([':id' => $id, ':slug' => $slug]);
    if ($stmt->fetch()) {
        errorResponse('Ya existe una categoría con ese ID o slug', 409);
    }

    $position = (int)($input['position'] ?? 0);

    $stmt = $db->prepare("
        INSERT INTO categories (id, name, slug, description, position)
        VALUES (:id, :name, :slug, :desc, :pos)
    ");
    $stmt->execute([
        ':id' => $id ?: $slug,
        ':name' => $name,
        ':slug' => $slug,
        ':desc' => sanitize($input['description'] ?? ''),
        ':pos' => $position,
    ]);

    successResponse(['id' => $id ?: $slug], 'Categoría creada exitosamente');
}

function adminUpdateCategory(): void {
    requireAdmin();
    $db = Database::getConnection();
    $input = getJsonInput();

    $id = sanitize($input['id'] ?? '');
    if (!$id) errorResponse('ID requerido');

    $fields = [];
    $params = [':id' => $id];

    if (isset($input['name'])) {
        $fields[] = 'name = :name';
        $params[':name'] = sanitize($input['name']);
    }
    if (isset($input['slug'])) {
        $fields[] = 'slug = :slug';
        $params[':slug'] = sanitize($input['slug']);
    }
    if (isset($input['description'])) {
        $fields[] = 'description = :desc';
        $params[':desc'] = sanitize($input['description']);
    }
    if (isset($input['position'])) {
        $fields[] = 'position = :pos';
        $params[':pos'] = (int)$input['position'];
    }

    if (empty($fields)) {
        successResponse(null, 'Sin cambios');
    }

    $sql = "UPDATE categories SET " . implode(', ', $fields) . " WHERE id = :id";
    $db->prepare($sql)->execute($params);

    successResponse(['id' => $id], 'Categoría actualizada exitosamente');
}

function adminDeleteCategory(): void {
    requireAdmin();
    $db = Database::getConnection();

    $id = getQueryParam('id');
    if (!$id) {
        $input = getJsonInput();
        $id = $input['id'] ?? '';
    }

    if (!$id) errorResponse('ID de categoría requerido');

    // Reasignar productos de esta categoría a NULL
    $db->prepare("UPDATE products SET category_id = NULL WHERE category_id = :id")
       ->execute([':id' => $id]);

    $stmt = $db->prepare("DELETE FROM categories WHERE id = :id");
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        errorResponse('Categoría no encontrada', 404);
    }

    successResponse(null, 'Categoría eliminada exitosamente');
}

// =============================================================
// ADMIN: Listar productos (todos los campos, incluyendo internos)
// =============================================================

function adminListProducts(): void {
    requireAdmin();
    $db = Database::getConnection();
    
    $stmt = $db->query("
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.created_at DESC
    ");
    $products = $stmt->fetchAll();
    
    // Parsear JSON fields
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

// =============================================================
// ADMIN: Listar categorías
// =============================================================

function adminListCategories(): void {
    requireAdmin();
    $db = Database::getConnection();
    
    $stmt = $db->query("
        SELECT c.*, COUNT(p.id) as product_count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id
        GROUP BY c.id
        ORDER BY c.position ASC, c.name ASC
    ");
    $categories = $stmt->fetchAll();
    
    foreach ($categories as &$c) {
        $c['product_count'] = (int)$c['product_count'];
        $c['position'] = (int)$c['position'];
    }
    
    successResponse($categories);
}

// =============================================================
// ADMIN: Listar pedidos con items
// =============================================================

function adminUpdateOrderStatus(): void {
    requireAdmin();
    $db = Database::getConnection();
    $input = getJsonInput();

    $orderId = sanitize($input['order_id'] ?? '');
    $newStatus = sanitize($input['status'] ?? '');

    if (!$orderId) errorResponse('order_id requerido');
    if (!$newStatus) errorResponse('status requerido');

    $validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!in_array($newStatus, $validStatuses)) {
        errorResponse('Estado inválido. Valores aceptados: ' . implode(', ', $validStatuses));
    }

    $stmt = $db->prepare("SELECT id, status, shipping_name, shipping_email FROM orders WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $orderId]);
    $order = $stmt->fetch();

    if (!$order) {
        errorResponse('Pedido no encontrado', 404);
    }

    $oldStatus = $order['status'];

    $stmt = $db->prepare("UPDATE orders SET status = :status, updated_at = NOW() WHERE id = :id");
    $stmt->execute([':status' => $newStatus, ':id' => $orderId]);

    // Enviar email según el nuevo estado
    // Enviar email según el nuevo estado
    if ($newStatus === 'confirmed' && $oldStatus !== 'confirmed') {
        try {
            // Re-enviar confirmación de pedido
            $orderDetailStmt = $db->prepare("SELECT * FROM orders WHERE id = :id LIMIT 1");
            $orderDetailStmt->execute([':id' => $orderId]);
            $orderDetail = $orderDetailStmt->fetch();
            $itemStmt = $db->prepare("SELECT product_id, product_name, product_price, quantity, line_total FROM order_items WHERE order_id = :order_id");
            $itemStmt->execute([':order_id' => $orderId]);
            $orderItems = $itemStmt->fetchAll();
            sendOrderConfirmationEmail(
                $order['shipping_email'], $order['shipping_name'], $orderId, $orderItems,
                (int)$orderDetail['subtotal'], (int)$orderDetail['shipping_cost'], (int)$orderDetail['discount'], (int)$orderDetail['total'],
                $orderDetail['shipping_address'], $orderDetail['shipping_city'], $orderDetail['shipping_region'], $orderDetail['shipping_zip'],
                $orderDetail['payment_method'] ?: 'manual', $orderDetail['coupon_code']
            );
        } catch (\Throwable $e) {
            logError('sendOrderConfirmationEmail Error: ' . $e->getMessage(), ['order_id' => $orderId]);
        }
    }

    if ($newStatus === 'shipped' && $oldStatus !== 'shipped') {
        try {
            sendOrderShippedEmail($order['shipping_email'], $order['shipping_name'], $orderId);
        } catch (\Throwable $e) {
            logError('sendOrderShippedEmail Error: ' . $e->getMessage(), ['order_id' => $orderId]);
        }
    }

    if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
        try {
            sendOrderCancelledEmail($order['shipping_email'], $order['shipping_name'], $orderId);
        } catch (\Throwable $e) {
            logError('sendOrderCancelledEmail Error: ' . $e->getMessage(), ['order_id' => $orderId]);
        }
    }

    successResponse(['id' => $orderId, 'status' => $newStatus], 'Estado actualizado');
}

function adminListOrders(): void {
    requireAdmin();
    $db = Database::getConnection();
    
    $orders = $db->query("
        SELECT id, user_id, status, shipping_name, shipping_email, 
               shipping_address, shipping_city, shipping_zip, 
               total, created_at, updated_at
        FROM orders 
        ORDER BY created_at DESC
        LIMIT 50
    ")->fetchAll();
    
    // Obtener items para cada orden
    foreach ($orders as &$order) {
        $stmt = $db->prepare("
            SELECT product_name as name, quantity, product_price as price, product_id
            FROM order_items 
            WHERE order_id = :id
        ");
        $stmt->execute([':id' => $order['id']]);
        $items = $stmt->fetchAll();
        
        foreach ($items as &$item) {
            $item['quantity'] = (int)$item['quantity'];
            $item['price'] = (int)$item['price'];
        }
        
        $order['items'] = $items;
        $order['total'] = (int)$order['total'];
    }
    
    successResponse($orders);
}

// =============================================================
// DASHBOARD STATS
// =============================================================

function adminDashboard(): void {
    requireAdmin();
    $db = Database::getConnection();

    $stats = [];

    // Productos totales
    $stats['totalProducts'] = (int)$db->query("SELECT COUNT(*) FROM products")->fetchColumn();

    // Categorías totales
    $stats['totalCategories'] = (int)$db->query("SELECT COUNT(*) FROM categories")->fetchColumn();

    // Stock bajo (stock_count entre 1 y 5)
    $stats['lowStock'] = (int)$db->query("SELECT COUNT(*) FROM products WHERE stock_count > 0 AND stock_count <= 5")->fetchColumn();

    // Agotados
    $stats['outOfStock'] = (int)$db->query("SELECT COUNT(*) FROM products WHERE in_stock = 0 OR stock_count <= 0")->fetchColumn();

    // Precio promedio
    $avgPrice = $db->query("SELECT AVG(price) FROM products")->fetchColumn();
    $stats['avgPrice'] = $avgPrice ? (int)$avgPrice : 0;

    // Destacados (rating >= 4.5)
    $stats['featured'] = (int)$db->query("SELECT COUNT(*) FROM products WHERE rating >= 4.5")->fetchColumn();

    // Con descuento
    $stats['withDiscount'] = (int)$db->query("SELECT COUNT(*) FROM products WHERE original_price IS NOT NULL")->fetchColumn();

    // Pedidos totales
    $stats['totalOrders'] = (int)$db->query("SELECT COUNT(*) FROM orders")->fetchColumn();

    // Usuarios totales
    $stats['totalUsers'] = (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn();

    $stats['maintenance'] = file_exists(__DIR__ . '/../.maintenance');

    successResponse($stats);
}

function adminToggleMaintenance(): void {
    $maintenanceFile = __DIR__ . '/../.maintenance';
    if (file_exists($maintenanceFile)) {
        unlink($maintenanceFile);
        successResponse(['maintenance' => false], 'Tienda activada');
    } else {
        file_put_contents($maintenanceFile, date('Y-m-d H:i:s'));
        successResponse(['maintenance' => true], 'Modo mantenimiento activado');
    }
}
