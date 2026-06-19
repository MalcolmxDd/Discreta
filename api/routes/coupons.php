<?php
// =============================================================
// Coupons API — CRUD y validación
// =============================================================

function validateCoupon(): void {
    $db = Database::getConnection();
    $input = getJsonInput();
    $code = sanitize(strtoupper($input['code'] ?? ''));
    $subtotal = (int)($input['subtotal'] ?? 0);

    if (!$code) {
        errorResponse('Código de cupón requerido', 400);
    }

    $stmt = $db->prepare("SELECT * FROM coupons WHERE code = :code AND is_active = 1");
    $stmt->execute([':code' => $code]);
    $coupon = $stmt->fetch();

    if (!$coupon) {
        errorResponse('Cupón inválido o expirado', 404);
    }

    // Verificar vigencia
    if ($coupon['expires_at'] && strtotime($coupon['expires_at']) < time()) {
        errorResponse('Este cupón ha expirado', 400);
    }

    // Verificar usos máximos
    if ($coupon['max_uses'] && (int)$coupon['used_count'] >= (int)$coupon['max_uses']) {
        errorResponse('Este cupón ya alcanzó su límite de usos', 400);
    }

    // Verificar monto mínimo
    if ($coupon['min_amount'] && $subtotal < (int)$coupon['min_amount']) {
        $min = number_format((int)$coupon['min_amount']);
        errorResponse("Monto mínimo para este cupón: $$min", 400);
    }

    $value = (int)$coupon['value'];
    if ($coupon['type'] === 'percentage') {
        $discount = (int)round($subtotal * $value / 100);
    } else {
        $discount = min($value, $subtotal);
    }

    successResponse([
        'code' => $coupon['code'],
        'type' => $coupon['type'],
        'value' => $value,
        'discount' => $discount,
    ]);
}

function adminListCoupons(): void {
    $db = Database::getConnection();
    $coupons = $db->query("SELECT * FROM coupons ORDER BY created_at DESC")->fetchAll();
    successResponse($coupons);
}

function adminCreateCoupon(): void {
    $db = Database::getConnection();
    $input = getJsonInput();

    $code = sanitize(strtoupper($input['code'] ?? ''));
    $type = sanitize($input['type'] ?? 'percentage');
    $value = (int)($input['value'] ?? 0);
    $minAmount = $input['min_amount'] !== null ? (int)$input['min_amount'] : null;
    $maxUses = $input['max_uses'] !== null ? (int)$input['max_uses'] : null;
    $expiresAt = !empty($input['expires_at']) ? $input['expires_at'] : null;

    if (!$code || $value <= 0) {
        errorResponse('Código y valor son requeridos', 400);
    }
    if (!in_array($type, ['percentage', 'fixed'])) {
        errorResponse('Tipo debe ser percentage o fixed', 400);
    }
    if ($type === 'percentage' && ($value < 1 || $value > 100)) {
        errorResponse('Porcentaje debe estar entre 1 y 100', 400);
    }
    if ($type === 'fixed' && $value < 100) {
        errorResponse('Monto fijo debe ser al menos $100', 400);
    }

    // Verificar duplicado
    $check = $db->prepare("SELECT id FROM coupons WHERE code = :code");
    $check->execute([':code' => $code]);
    if ($check->fetch()) {
        errorResponse('Ya existe un cupón con ese código', 409);
    }

    $id = generateUuid();
    $stmt = $db->prepare("INSERT INTO coupons (id, code, type, value, min_amount, max_uses, expires_at) VALUES (:id, :code, :type, :value, :min_amount, :max_uses, :expires_at)");
    $stmt->execute([
        ':id' => $id,
        ':code' => $code,
        ':type' => $type,
        ':value' => $value,
        ':min_amount' => $minAmount,
        ':max_uses' => $maxUses,
        ':expires_at' => $expiresAt,
    ]);

    successResponse(['id' => $id, 'code' => $code], 'Cupón creado', 201);
}

function adminUpdateCoupon(): void {
    $db = Database::getConnection();
    $input = getJsonInput();
    $id = sanitize($input['id'] ?? '');

    if (!$id) {
        errorResponse('ID requerido', 400);
    }

    $fields = [];
    $params = [':id' => $id];

    foreach (['code', 'type', 'value', 'min_amount', 'max_uses', 'expires_at', 'is_active'] as $field) {
        if (isset($input[$field])) {
            if ($field === 'code') {
                $input[$field] = sanitize(strtoupper($input[$field]));
            } elseif (in_array($field, ['value', 'min_amount', 'max_uses', 'is_active'])) {
                $input[$field] = (int)$input[$field];
            } elseif ($field === 'expires_at' && empty($input[$field])) {
                continue;
            }
            $fields[] = "$field = :$field";
            $params[":$field"] = $input[$field];
        }
    }

    if (empty($fields)) {
        errorResponse('Sin campos para actualizar', 400);
    }

    $sql = "UPDATE coupons SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    successResponse(null, 'Cupón actualizado');
}

function adminDeleteCoupon(): void {
    $db = Database::getConnection();
    $input = getJsonInput();
    $id = sanitize($input['id'] ?? '');

    if (!$id) {
        errorResponse('ID requerido', 400);
    }

    $stmt = $db->prepare("DELETE FROM coupons WHERE id = :id");
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        errorResponse('Cupón no encontrado', 404);
    }

    successResponse(null, 'Cupón eliminado');
}
