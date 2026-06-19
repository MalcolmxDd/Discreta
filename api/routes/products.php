<?php
// =============================================================
// Products API
// =============================================================

function listProducts(): void {
    $db = Database::getConnection();
    
    $category = getQueryParam('category');
    $search = getQueryParam('search');
    $minPrice = getQueryParam('min_price');
    $maxPrice = getQueryParam('max_price');
    $sort = getQueryParam('sort', 'default');
    $featured = getQueryParam('featured');
    $limit = getQueryParam('limit', 50);
    $offset = getQueryParam('offset', 0);
    
    $where = [];
    $params = [];
    
    if ($category && $category !== 'todas') {
        $where[] = 'p.category_id = :category';
        $params[':category'] = $category;
    }
    
    if ($search) {
        $where[] = '(p.name LIKE :search OR p.description LIKE :search2 OR p.tags LIKE :search3)';
        $params[':search'] = "%$search%";
        $params[':search2'] = "%$search%";
        $params[':search3'] = "%$search%";
    }
    
    if ($minPrice !== null) {
        $where[] = 'p.price >= :min_price';
        $params[':min_price'] = (int)$minPrice;
    }
    
    if ($maxPrice !== null) {
        $where[] = 'p.price <= :max_price';
        $params[':max_price'] = (int)$maxPrice;
    }
    
    if ($featured === 'true' || $featured === '1') {
        $where[] = 'p.is_featured = 1';
    }
    
    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    
    // Sort
    $orderClause = match ($sort) {
        'price_asc' => 'ORDER BY p.price ASC',
        'price_desc' => 'ORDER BY p.price DESC',
        'rating' => 'ORDER BY p.rating DESC',
        'name' => 'ORDER BY p.name ASC',
        default => 'ORDER BY p.created_at DESC',
    };
    
    // Count total matching products
    $countSql = "SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id $whereClause";
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($params);
    $totalCount = (int)$countStmt->fetchColumn();

    $sql = "
        SELECT 
            p.id, p.name, p.slug, p.description, p.long_description,
            p.price, p.original_price, p.image, p.images, p.gradient,
            p.category_id AS category, p.tags, p.rating,
            p.in_stock, p.stock_count, p.features, p.is_featured,
            c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        $whereClause
        $orderClause
        LIMIT " . (int)$limit . " OFFSET " . (int)$offset
    ;
    
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll();
    
    // Parsear JSON fields
    foreach ($products as &$product) {
        $product['tags'] = json_decode($product['tags'] ?? '[]', true) ?: [];
        $product['features'] = json_decode($product['features'] ?? '[]', true) ?: [];
        $product['images'] = json_decode($product['images'] ?? '[]', true) ?: [];
        $product['in_stock'] = (bool)$product['in_stock'];
        $product['is_featured'] = (bool)$product['is_featured'];
        $product['rating'] = (float)$product['rating'];
        $product['price'] = (int)$product['price'];
        $product['original_price'] = $product['original_price'] ? (int)$product['original_price'] : null;
        $product['stock_count'] = (int)$product['stock_count'];
    }
    
    successResponse([
        'items' => $products,
        'total' => $totalCount,
        'limit' => (int)$limit,
        'offset' => (int)$offset,
    ]);
}

function getProduct(string $slug): void {
    $db = Database::getConnection();
    
    $stmt = $db->prepare("
        SELECT 
            p.id, p.name, p.slug, p.description, p.long_description,
            p.price, p.original_price, p.image, p.images, p.gradient,
            p.category_id AS category, p.tags, p.rating,
            p.in_stock, p.stock_count, p.features, p.is_featured,
            c.name AS category_name, c.slug AS category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.slug = :slug
        LIMIT 1
    ");
    $stmt->execute([':slug' => $slug]);
    $product = $stmt->fetch();
    
    if (!$product) {
        errorResponse('Producto no encontrado', 404);
    }    $product['tags'] = json_decode($product['tags'] ?? '[]', true) ?: [];
    $product['features'] = json_decode($product['features'] ?? '[]', true) ?: [];
    $product['images'] = json_decode($product['images'] ?? '[]', true) ?: [];
    $product['in_stock'] = (bool)$product['in_stock'];
    $product['is_featured'] = (bool)$product['is_featured'];
    $product['rating'] = (float)$product['rating'];
    $product['price'] = (int)$product['price'];
    $product['original_price'] = $product['original_price'] ? (int)$product['original_price'] : null;
    $product['stock_count'] = (int)$product['stock_count'];

    successResponse($product);
}
