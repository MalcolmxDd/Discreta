<?php
// =============================================================
// Categories API
// =============================================================

function listCategories(): void {
    $db = Database::getConnection();
    
    $stmt = $db->query("
        SELECT 
            c.id, c.name, c.slug, c.description, c.position,
            COUNT(p.id) AS product_count
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id
        ORDER BY c.position ASC
    ");
    
    $categories = $stmt->fetchAll();
    
    foreach ($categories as &$cat) {
        $cat['product_count'] = (int)$cat['product_count'];
    }
    
    successResponse($categories);
}
