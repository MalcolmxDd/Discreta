<?php
// =============================================================
// Reviews API
// =============================================================

function createReview(): void {
    $db = Database::getConnection();
    $input = getJsonInput();

    $productId = sanitize($input['productId'] ?? '');
    $userName = sanitize($input['userName'] ?? '');
    $rating = (int)($input['rating'] ?? 0);
    $comment = sanitize($input['comment'] ?? '');
    $userId = $input['userId'] ?? null;

    // Validaciones
    if (!$productId) {
        errorResponse('Se requiere el ID del producto');
    }
    if (!validateRequired($userName, 1)) {
        errorResponse('El nombre es requerido');
    }
    if ($rating < 1 || $rating > 5) {
        errorResponse('La puntuación debe ser entre 1 y 5');
    }
    if (!validateRequired($comment, 1)) {
        errorResponse('El comentario no puede estar vacío');
    }

    // Verificar que el producto existe
    $stmt = $db->prepare("SELECT id FROM products WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $productId]);
    if (!$stmt->fetch()) {
        errorResponse('Producto no encontrado', 404);
    }

    // Si el usuario está autenticado, verificar que exista
    if ($userId) {
        $stmt = $db->prepare("SELECT id FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $userId]);
        if (!$stmt->fetch()) {
            $userId = null; // Si no existe, tratar como guest
        }
    }

    $id = generateUUID();

    $stmt = $db->prepare("
        INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment, created_at)
        VALUES (:id, :product_id, :user_id, :user_name, :rating, :comment, NOW())
    ");
    $stmt->execute([
        ':id' => $id,
        ':product_id' => $productId,
        ':user_id' => $userId,
        ':user_name' => $userName,
        ':rating' => $rating,
        ':comment' => $comment,
    ]);

    // Actualizar el rating del producto en base al promedio de reseñas
    $avgStmt = $db->prepare("SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM reviews WHERE product_id = :pid");
    $avgStmt->execute([':pid' => $productId]);
    $newAvg = (float)$avgStmt->fetchColumn();
    $db->prepare("UPDATE products SET rating = :rating WHERE id = :id")
       ->execute([':rating' => $newAvg, ':id' => $productId]);

    successResponse([
        'id' => $id,
        'productId' => $productId,
        'userName' => $userName,
        'rating' => $rating,
        'comment' => $comment,
        'date' => date('Y-m-d'),
    ], 'Reseña creada exitosamente');
}


function listReviews(): void {
    $db = Database::getConnection();
    
    $productId = getQueryParam('productId');
    
    if (!$productId) {
        errorResponse('Se requiere el parámetro productId');
    }
    
    $stmt = $db->prepare("
        SELECT id, product_id AS productId, user_name AS userName, 
               rating, comment, created_at AS date
        FROM reviews 
        WHERE product_id = :product_id
        ORDER BY created_at DESC
    ");
    $stmt->execute([':product_id' => $productId]);
    $reviews = $stmt->fetchAll();
    
    foreach ($reviews as &$review) {
        $review['rating'] = (int)$review['rating'];
    }
    
    // Calcular promedio y distribución
    $avgStmt = $db->prepare("
        SELECT 
            COALESCE(ROUND(AVG(rating), 1), 0) AS average,
            COUNT(*) AS total,
            SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS star5,
            SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS star4,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS star3,
            SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS star2,
            SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS star1
        FROM reviews 
        WHERE product_id = :product_id
    ");
    $avgStmt->execute([':product_id' => $productId]);
    $stats = $avgStmt->fetch();
    
    $distribution = [
        5 => (int)($stats['star5'] ?? 0),
        4 => (int)($stats['star4'] ?? 0),
        3 => (int)($stats['star3'] ?? 0),
        2 => (int)($stats['star2'] ?? 0),
        1 => (int)($stats['star1'] ?? 0),
    ];
    
    successResponse([
        'reviews' => $reviews,
        'average' => (float)($stats['average'] ?? 0),
        'total' => (int)($stats['total'] ?? 0),
        'distribution' => $distribution,
    ]);
}
