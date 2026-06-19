<?php
// =============================================================
// Sitemap XML — Genera sitemap dinámico desde la BD
// =============================================================

function generateSitemap(): void {
    $db = Database::getConnection();
    $baseUrl = 'https://discretasex.cl';
    $today = date('Y-m-d');

    // --- Páginas estáticas con prioridad ---
    $staticPages = [
        ['loc' => '',                        'priority' => '1.0', 'changefreq' => 'daily'],
        ['loc' => '/productos',              'priority' => '0.9', 'changefreq' => 'daily'],
        ['loc' => '/about',                  'priority' => '0.6', 'changefreq' => 'monthly'],
        ['loc' => '/contact',                'priority' => '0.5', 'changefreq' => 'monthly'],
        ['loc' => '/faq',                    'priority' => '0.6', 'changefreq' => 'monthly'],
        ['loc' => '/envios',                 'priority' => '0.5', 'changefreq' => 'monthly'],
        ['loc' => '/devoluciones',           'priority' => '0.5', 'changefreq' => 'monthly'],
        ['loc' => '/terminos',               'priority' => '0.3', 'changefreq' => 'yearly'],
        ['loc' => '/privacidad',             'priority' => '0.3', 'changefreq' => 'yearly'],
        ['loc' => '/login',                  'priority' => '0.4', 'changefreq' => 'monthly'],
        ['loc' => '/register',               'priority' => '0.4', 'changefreq' => 'monthly'],
        ['loc' => '/forgot-password',        'priority' => '0.2', 'changefreq' => 'monthly'],
        ['loc' => '/cart',                   'priority' => '0.3', 'changefreq' => 'monthly'],
        ['loc' => '/wishlist',               'priority' => '0.3', 'changefreq' => 'monthly'],
        ['loc' => '/order-status',           'priority' => '0.4', 'changefreq' => 'weekly'],
    ];

    // --- Categorías ---
    $catStmt = $db->query("SELECT slug, updated_at FROM categories ORDER BY position ASC");
    $categories = $catStmt->fetchAll();

    // --- Productos ---
    $prodStmt = $db->query("SELECT slug, updated_at FROM products WHERE in_stock = 1 ORDER BY created_at DESC");
    $products = $prodStmt->fetchAll();

    // Generar XML
    header('Content-Type: application/xml; charset=utf-8');
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

    // Páginas estáticas
    foreach ($staticPages as $page) {
        echo '  <url>' . "\n";
        echo '    <loc>' . $baseUrl . $page['loc'] . '</loc>' . "\n";
        echo '    <lastmod>' . $today . '</lastmod>' . "\n";
        echo '    <changefreq>' . $page['changefreq'] . '</changefreq>' . "\n";
        echo '    <priority>' . $page['priority'] . '</priority>' . "\n";
        echo '  </url>' . "\n";
    }

    // Categorías
    foreach ($categories as $cat) {
        $lastmod = $cat['updated_at'] ? date('Y-m-d', strtotime($cat['updated_at'])) : $today;
        echo '  <url>' . "\n";
        echo '    <loc>' . $baseUrl . '/productos?categoria=' . htmlspecialchars($cat['slug'], ENT_XML1) . '</loc>' . "\n";
        echo '    <lastmod>' . $lastmod . '</lastmod>' . "\n";
        echo '    <changefreq>weekly</changefreq>' . "\n";
        echo '    <priority>0.7</priority>' . "\n";
        echo '  </url>' . "\n";
    }

    // Productos (los más importantes para SEO)
    foreach ($products as $product) {
        $lastmod = $product['updated_at'] ? date('Y-m-d', strtotime($product['updated_at'])) : $today;
        echo '  <url>' . "\n";
        echo '    <loc>' . $baseUrl . '/productos/' . htmlspecialchars($product['slug'], ENT_XML1) . '</loc>' . "\n";
        echo '    <lastmod>' . $lastmod . '</lastmod>' . "\n";
        echo '    <changefreq>weekly</changefreq>' . "\n";
        echo '    <priority>0.8</priority>' . "\n";
        echo '  </url>' . "\n";
    }

    echo '</urlset>' . "\n";
    exit;
}
