<?php
// =============================================================
// Auth API
// =============================================================

require_once __DIR__ . '/../email_templates.php';

function registerUser(): void {
    $db = Database::getConnection();
    $input = getJsonInput();
    
    $name = sanitize($input['name'] ?? '');
    $email = sanitize($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    // Validaciones
    if (!validateRequired($name, 2)) {
        errorResponse('El nombre debe tener al menos 2 caracteres');
    }
    if (!validateEmail($email)) {
        errorResponse('Email inválido');
    }
    
    // Validar fortaleza de contraseña
    $passError = validatePasswordStrength($password);
    if ($passError) {
        errorResponse($passError);
    }
    
    // Verificar email único
    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        errorResponse('Este email ya está registrado', 409);
    }
    
    // Crear usuario
    $id = generateUUID();
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    
    $stmt = $db->prepare("
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES (:id, :name, :email, :password_hash, 'user')
    ");
    $stmt->execute([
        ':id' => $id,
        ':name' => $name,
        ':email' => $email,
        ':password_hash' => $passwordHash,
    ]);
    
    // Enviar email de bienvenida (no bloqueante)
    try {
        sendWelcomeEmail($email, $name);
    } catch (\Throwable $e) {
        // ignorar error de email
    }

    // Generar JWT
    $token = generateJWT([
        'id' => $id,
        'name' => $name,
        'email' => $email,
        'role' => 'user',
    ]);
    
    successResponse([
        'token' => $token,
        'user' => [
            'id' => $id,
            'name' => $name,
            'email' => $email,
            'role' => 'user',
        ],
    ], 'Registro exitoso');
}

function loginUser(): void {
    $db = Database::getConnection();
    $input = getJsonInput();
    
    $email = sanitize($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    if (!validateEmail($email)) {
        errorResponse('Email inválido');
    }
    if (empty($password)) {
        errorResponse('Contraseña requerida');
    }
    
    // Rate limiting: máx 5 intentos cada 15 minutos por IP
    $rateFile = checkLoginRateLimit();
    
    // Buscar usuario
    $stmt = $db->prepare("
        SELECT id, name, email, password_hash, role 
        FROM users 
        WHERE email = :email 
        LIMIT 1
    ");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        recordLoginAttempt($rateFile);
        errorResponse('Email o contraseña incorrectos', 401);
    }
    
    // Login exitoso — limpiar intentos
    clearLoginAttempts($rateFile);
    
    // Generar JWT
    $token = generateJWT([
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
    ]);
    
    successResponse([
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
        ],
    ], 'Login exitoso');
}

function getMe(): void {
    $authUser = requireAuth();
    
    $db = Database::getConnection();
    $stmt = $db->prepare("
        SELECT id, name, email, role, phone, default_address, created_at
        FROM users WHERE id = :id LIMIT 1
    ");
    $stmt->execute([':id' => $authUser['id']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        errorResponse('Usuario no encontrado', 404);
    }
    
    successResponse($user);
}

function forgotPassword(): void {
    $db = Database::getConnection();
    $input = getJsonInput();
    $email = sanitize($input['email'] ?? '');

    if (!validateEmail($email)) {
        errorResponse('Email inválido', 400);
    }

    // Buscar usuario (no revelar si existe o no)
    $stmt = $db->prepare("SELECT id, name FROM users WHERE email = :email LIMIT 1");
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    // Siempre responder igual para no revelar emails registrados
    $responseMsg = 'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.';

    if ($user) {
        // Generar token único (64 chars hex)
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

        // Guardar token
        $insertStmt = $db->prepare("INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (:id, :user_id, :token, :expires_at)");
        $insertStmt->execute([
            ':id' => generateUUID(),
            ':user_id' => $user['id'],
            ':token' => $token,
            ':expires_at' => $expiresAt,
        ]);

        // Enviar email de restablecimiento
        $resetLink = "https://discretasex.cl/reset-password?token=$token&email=" . urlencode($email);
        sendPasswordResetEmail($email, $user['name'], $resetLink);
    }

    successResponse(['message' => $responseMsg]);
}

function resetPassword(): void {
    $db = Database::getConnection();
    $input = getJsonInput();
    $token = sanitize($input['token'] ?? '');
    $email = sanitize($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (!$token || !$email || !$password) {
        errorResponse('Token, email y contraseña son requeridos', 400);
    }

    $passError = validatePasswordStrength($password);
    if ($passError) {
        errorResponse($passError);
    }

    // Verificar token
    $stmt = $db->prepare("
        SELECT prt.id, prt.user_id, u.email
        FROM password_reset_tokens prt
        JOIN users u ON u.id = prt.user_id
        WHERE prt.token = :token AND u.email = :email AND prt.expires_at > NOW()
        LIMIT 1
    ");
    $stmt->execute([':token' => $token, ':email' => $email]);
    $row = $stmt->fetch();

    if (!$row) {
        errorResponse('Token inválido o expirado', 400);
    }

    // Obtener datos del usuario para el email
    $userStmt = $db->prepare("SELECT name, email FROM users WHERE id = :id LIMIT 1");
    $userStmt->execute([':id' => $row['user_id']]);
    $userData = $userStmt->fetch();

    // Actualizar contraseña
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $db->prepare("UPDATE users SET password_hash = :hash WHERE id = :id")->execute([
        ':hash' => $passwordHash,
        ':id' => $row['user_id'],
    ]);

    // Eliminar token usado
    $db->prepare("DELETE FROM password_reset_tokens WHERE id = :id")->execute([':id' => $row['id']]);

    // Notificar cambio de contraseña (no bloqueante)
    if ($userData) {
        try {
            sendPasswordChangedEmail($userData['email'], $userData['name']);
        } catch (\Throwable $e) {
            // ignorar error de email
        }
    }

    successResponse(null, 'Contraseña actualizada exitosamente');
}


