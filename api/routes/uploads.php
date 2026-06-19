<?php
// =============================================================
// Upload API — Subida de imágenes para productos
// =============================================================

define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
define('UPLOAD_DIR_RELATIVE', '/uploads/products/');

function uploadProductImage(): void {
    requireAdmin();

    if (!isset($_FILES['image'])) {
        errorResponse('No se recibió ningún archivo. Usa el campo \"image\".', 400);
    }

    $file = $_FILES['image'];

    // Validar error de subida
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'El archivo excede el tamaño máximo permitido por el servidor.',
            UPLOAD_ERR_FORM_SIZE => 'El archivo excede el tamaño máximo del formulario.',
            UPLOAD_ERR_PARTIAL => 'El archivo se subió parcialmente.',
            UPLOAD_ERR_NO_FILE => 'No se seleccionó ningún archivo.',
            UPLOAD_ERR_NO_TMP_DIR => 'Falta la carpeta temporal del servidor.',
            UPLOAD_ERR_CANT_WRITE => 'Error al escribir el archivo en el disco.',
        ];
        $msg = $errors[$file['error']] ?? 'Error desconocido al subir el archivo.';
        errorResponse($msg, 400);
    }

    // Validar tipo MIME real
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, ALLOWED_TYPES)) {
        errorResponse(
            'Tipo de archivo no permitido: ' . $mimeType . '. Solo se aceptan JPG, PNG, WebP y GIF.',
            400
        );
    }

    // Validar tamaño
    if ($file['size'] > MAX_FILE_SIZE) {
        errorResponse('La imagen no puede superar los 5MB. El archivo pesa ' . round($file['size'] / 1024 / 1024, 2) . 'MB.', 400);
    }

    // Validar extensión
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $extMap = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];
    $expectedExt = $extMap[$mimeType] ?? '';
    if ($ext !== $expectedExt && $ext !== 'jpeg') {
        // Si la extensión no coincide, usamos la correcta según el MIME
        $ext = $expectedExt;
    }

    // Crear directorio de uploads si no existe
    // uploads.php está en api/routes/, subimos 2 niveles para llegar a la raíz web
    $uploadDir = dirname(__DIR__, 2) . UPLOAD_DIR_RELATIVE;

    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            errorResponse('Error al crear el directorio de uploads. Verifica permisos del servidor.', 500);
        }
    }

    // Verificar que el directorio tenga permisos de escritura
    if (!is_writable($uploadDir)) {
        errorResponse('El directorio de uploads no tiene permisos de escritura.', 500);
    }

    // Generar nombre único (sin espacios ni caracteres especiales)
    $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '', $file['name']);
    $safeName = substr(pathinfo($safeName, PATHINFO_FILENAME), 0, 60);
    $filename = uniqid() . '_' . $safeName . '.' . $ext;
    $filepath = $uploadDir . $filename;

    // Evitar sobreescritura: si ya existe, agregar sufijo numérico
    $counter = 1;
    while (file_exists($filepath)) {
        $filename = uniqid() . '_' . $safeName . '_' . $counter . '.' . $ext;
        $filepath = $uploadDir . $filename;
        $counter++;
    }

    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        errorResponse('Error al guardar la imagen en el servidor. Verifica permisos.', 500);
    }

    // Construir URL pública
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $publicUrl = $protocol . '://' . $host . UPLOAD_DIR_RELATIVE . $filename;

    successResponse([
        'url' => $publicUrl,
        'relative_url' => UPLOAD_DIR_RELATIVE . $filename,
        'filename' => $filename,
        'size' => $file['size'],
        'mime' => $mimeType,
    ], 'Imagen subida exitosamente');
}

function deleteUploadedImage(): void {
    requireAdmin();

    $input = getJsonInput();
    $url = $input['url'] ?? '';

    if (!$url) {
        errorResponse('URL de imagen requerida.', 400);
    }

    // Extraer el path relativo desde la URL
    // Ej: https://discretasex.cl/uploads/products/abc123_foto.jpg → /uploads/products/abc123_foto.jpg
    $parsed = parse_url($url);
    $path = $parsed['path'] ?? '';

    // Validar que sea una imagen de nuestro sistema
    if (!str_starts_with($path, UPLOAD_DIR_RELATIVE)) {
        errorResponse('La URL no pertenece al directorio de uploads.', 400);
    }

    // Construir ruta absoluta en el servidor
    // uploads.php está en api/routes/, subimos 2 niveles para llegar a la raíz web
    $uploadDir = dirname(__DIR__, 2) . UPLOAD_DIR_RELATIVE;
    // El path tiene /uploads/products/filename, sacamos solo el filename
    $filename = basename($path);
    $filepath = $uploadDir . $filename;

    if (!file_exists($filepath)) {
        // Si el archivo no existe, no es error — ya fue eliminado antes
        successResponse(null, 'La imagen ya había sido eliminada anteriormente.');
    }

    if (!unlink($filepath)) {
        errorResponse('Error al eliminar la imagen del servidor. Verifica permisos.', 500);
    }

    successResponse(['filename' => $filename], 'Imagen eliminada exitosamente.');
}
