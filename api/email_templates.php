<?php
// =============================================================
// DiscretaStore — Templates de Email
// =============================================================

function emailStyles(): string {
    return "
    <style>
        body{font-family:Outfit,Helvetica,sans-serif;background:#fdf5f7;padding:24px;margin:0}
        .container{max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)}
        .header{background:#e94e8a;padding:28px 24px;text-align:center}
        .header h1{color:#fff;margin:0 0 4px;font-size:22px}
        .header p{color:rgba(255,255,255,.85);margin:0;font-size:14px}
        .body{padding:24px}
        .body p{color:#333;font-size:15px;line-height:1.6;margin:0 0 12px}
        .table{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px}
        .table thead tr{background:#fdf5f7}
        .table th{padding:10px 8px;text-align:left;font-weight:600;color:#555;font-size:13px}
        .table td{padding:10px 8px;border-bottom:1px solid #eee;color:#333}
        .table td:last-child,.table th:last-child{text-align:right}
        .table td:nth-child(2){text-align:center}
        .btn{display:inline-block;background:#e94e8a;color:#fff!important;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px}
        .divider{border:none;border-top:1px solid #eee;margin:16px 0}
        .footer-text{color:#888;font-size:13px;line-height:1.5;margin:0 0 4px}
        .total-row{font-size:20px;font-weight:700;text-align:right;margin:12px 0}
        .total-row span{color:#e94e8a}
        .info-grid{background:#fafafa;border-radius:10px;padding:16px;margin:16px 0;font-size:14px;line-height:1.8}
        .info-grid strong{color:#555}
        .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
        .badge-confirmed{background:#e8f5e9;color:#2e7d32}
        .badge-shipped{background:#e3f2fd;color:#1565c0}
        .badge-cancelled{background:#fbe9e7;color:#c62828}
        .badge-pending{background:#fff3e0;color:#e65100}
    </style>";
}

function emailHeader(string $title, string $subtitle = ''): string {
    return "
    <div class='header'>
        <h1>$title</h1>
        " . ($subtitle ? "<p>$subtitle</p>" : "") . "
    </div>";
}

function emailFooter(): string {
    return "
    <div style='padding:24px;text-align:center;background:#fafafa'>
        <p style='color:#888;font-size:13px;margin:0 0 8px'>DiscretaStore — Tu tienda de confianza</p>
        <p style='color:#aaa;font-size:12px;margin:0'>
            <a href='https://discretasex.cl' style='color:#e94e8a;text-decoration:none'>discretasex.cl</a>
            &nbsp;·&nbsp;
            <a href='mailto:hola@discretastore.cl' style='color:#e94e8a;text-decoration:none'>hola@discretastore.cl</a>
            &nbsp;·&nbsp;
            <a href='https://discretasex.cl/envios' style='color:#e94e8a;text-decoration:none'>Envíos</a>
        </p>
        <p style='color:#ccc;font-size:11px;margin:8px 0 0'>Si tienes dudas, responde este correo o escríbenos a hola@discretastore.cl</p>
    </div>";
}

function emailWrapper(string $bodyContent): string {
    return "<html><head>" . emailStyles() . "</head><body><div class='container'>$bodyContent" . emailFooter() . "</div></body></html>";
}

function sendEmail(string $to, string $subject, string $htmlBody): bool {
    $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: DiscretaStore <no-reply@discretasex.cl>\r\n";
    $headers .= "Reply-To: hola@discretastore.cl\r\n";
    return @mail($to, $encodedSubject, $htmlBody, $headers);
}

// =============================================================
// 1. Confirmación de pedido
// =============================================================

function renderOrderConfirmationEmail(
    string $name,
    string $orderId,
    array $items,
    int $subtotal,
    int $shippingCost,
    int $discount,
    int $total,
    string $address,
    string $city,
    string $region,
    string $zip,
    string $paymentMethod,
    ?string $couponCode = null
): string {
    $shortId = substr($orderId, 0, 8);
    $paymentLabel = $paymentMethod === 'mercadopago' ? 'MercadoPago (Tarjeta Débito/Crédito)' : 'Pago manual';

    $itemsHtml = '';
    foreach ($items as $item) {
        $itemsHtml .= "<tr>
            <td style='padding:10px 8px;border-bottom:1px solid #eee'>{$item['product_name']}</td>
            <td style='padding:10px 8px;border-bottom:1px solid #eee;text-align:center'>x{$item['quantity']}</td>
            <td style='padding:10px 8px;border-bottom:1px solid #eee;text-align:right'>$" . number_format($item['line_total']) . "</td>
        </tr>";
    }

    $discountHtml = $discount > 0 ? "
        <tr>
            <td colspan='2' style='padding:6px 8px;text-align:right;color:#888'>Descuento" . ($couponCode ? " (cupón <strong>$couponCode</strong>)" : "") . "</td>
            <td style='padding:6px 8px;text-align:right;color:#2e7d32'>-$" . number_format($discount) . "</td>
        </tr>" : "";

    $body = emailHeader("¡Pedido Confirmado!", "Gracias por comprar en DiscretaStore") . "
    <div class='body'>
        <p>Hola <strong>$name</strong>,</p>
        <p>Tu pedido <strong>#$shortId</strong> ha sido recibido y está siendo preparado. Te avisaremos cuando esté en camino.</p>

        <table class='table'>
            <thead><tr>
                <th>Producto</th>
                <th style='text-align:center'>Cant.</th>
                <th style='text-align:right'>Total</th>
            </tr></thead>
            <tbody>$itemsHtml</tbody>
            <tfoot>
                <tr><td colspan='2' style='padding:6px 8px;text-align:right;color:#888'>Subtotal</td>
                    <td style='padding:6px 8px;text-align:right'>$" . number_format($subtotal) . "</td></tr>
                <tr><td colspan='2' style='padding:6px 8px;text-align:right;color:#888'>Envío</td>
                    <td style='padding:6px 8px;text-align:right'>" . ($shippingCost > 0 ? "$" . number_format($shippingCost) : "<span style='color:#2e7d32'>Gratis</span>") . "</td></tr>
                $discountHtml
                <tr><td colspan='2' style='padding:8px;text-align:right;font-weight:700'>Total</td>
                    <td style='padding:8px;text-align:right;font-weight:700;color:#e94e8a;font-size:18px'>$" . number_format($total) . "</td></tr>
            </tfoot>
        </table>

        <div class='info-grid'>
            <strong>📦 Dirección de envío</strong><br>
            $address, $city, $region<br>
            Código Postal: $zip<br><br>
            <strong>💳 Método de pago</strong><br>
            $paymentLabel
        </div>

        <hr class='divider'>
        <p class='footer-text'>
            📍 <a href='https://discretasex.cl/order-status?email=&order=" . urlencode($orderId) . "' style='color:#e94e8a'>Ver estado del pedido</a>
        </p>
    </div>";

    return emailWrapper($body);
}

function sendOrderConfirmationEmail(
    string $to,
    string $name,
    string $orderId,
    array $items,
    int $subtotal,
    int $shippingCost,
    int $discount,
    int $total,
    string $address,
    string $city,
    string $region,
    string $zip,
    string $paymentMethod,
    ?string $couponCode = null
): void {
    $subject = "DiscretaStore — Pedido #" . substr($orderId, 0, 8) . " confirmado";
    $html = renderOrderConfirmationEmail($name, $orderId, $items, $subtotal, $shippingCost, $discount, $total, $address, $city, $region, $zip, $paymentMethod, $couponCode);
    sendEmail($to, $subject, $html);

    // Notificar al admin
    $adminSubject = "[Admin] Nuevo pedido #" . substr($orderId, 0, 8);
    $adminHtml = emailWrapper(emailHeader("Nuevo Pedido") . "
    <div class='body'>
        <p>Nuevo pedido de <strong>$name</strong> ($to)</p>
        <div class='info-grid'>
            <strong>ID:</strong> $orderId<br>
            <strong>Total:</strong> $" . number_format($total) . "<br>
            <strong>Productos:</strong> " . count($items) . "<br>
            <strong>Dirección:</strong> $address, $city, $region
        </div>
    </div>");
    sendEmail('admin@discretastore.cl', $adminSubject, $adminHtml);
}

// =============================================================
// 2. Bienvenida / Confirmación de registro
// =============================================================

function renderWelcomeEmail(string $name): string {
    $body = emailHeader("¡Bienvenido a DiscretaStore!", "Tu cuenta ha sido creada exitosamente") . "
    <div class='body'>
        <p>Hola <strong>$name</strong>,</p>
        <p>Gracias por crear una cuenta en DiscretaStore. Ya puedes disfrutar de:</p>
        <p>
            ✅ Seguimiento de tus pedidos en tiempo real<br>
            💜 Guardar tus productos favoritos en Wishlist<br>
            🚚 Acceso a tu historial de compras<br>
            🎁 Recibir ofertas y novedades exclusivas
        </p>
        <div style='text-align:center;margin:20px 0'>
            <a href='https://discretasex.cl/products' class='btn'>Explorar productos</a>
        </div>
        <hr class='divider'>
        <p class='footer-text'>Si tienes alguna duda, responde este correo o escríbenos a hola@discretastore.cl</p>
    </div>";
    return emailWrapper($body);
}

function sendWelcomeEmail(string $to, string $name): void {
    $subject = "DiscretaStore — ¡Bienvenido, $name!";
    $html = renderWelcomeEmail($name);
    sendEmail($to, $subject, $html);
}

// =============================================================
// 3. Restablecer contraseña
// =============================================================

function renderPasswordResetEmail(string $name, string $resetLink): string {
    $body = emailHeader("Restablece tu contraseña") . "
    <div class='body'>
        <p>Hola <strong>$name</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para crear una nueva:</p>
        <div style='text-align:center;margin:24px 0'>
            <a href='$resetLink' class='btn'>Restablecer contraseña</a>
        </div>
        <p class='footer-text'>Este enlace expira en 1 hora.</p>
        <p class='footer-text'>Si no solicitaste esto, ignora este mensaje.</p>
    </div>";
    return emailWrapper($body);
}

function sendPasswordResetEmail(string $to, string $name, string $resetLink): void {
    $subject = "DiscretaStore — Restablece tu contraseña";
    $html = renderPasswordResetEmail($name, $resetLink);
    sendEmail($to, $subject, $html);
}

// =============================================================
// 4. Contraseña actualizada
// =============================================================

function renderPasswordChangedEmail(string $name): string {
    $body = emailHeader("Contraseña actualizada") . "
    <div class='body'>
        <p>Hola <strong>$name</strong>,</p>
        <p>Tu contraseña ha sido cambiada exitosamente.</p>
        <p>Si no realizaste este cambio, por favor contáctanos de inmediato a <a href='mailto:hola@discretastore.cl' style='color:#e94e8a'>hola@discretastore.cl</a>.</p>
        <div style='text-align:center;margin:20px 0'>
            <a href='https://discretasex.cl/account' class='btn'>Ir a mi cuenta</a>
        </div>
    </div>";
    return emailWrapper($body);
}

function sendPasswordChangedEmail(string $to, string $name): void {
    $subject = "DiscretaStore — Contraseña actualizada";
    $html = renderPasswordChangedEmail($name);
    sendEmail($to, $subject, $html);
}

// =============================================================
// 5. Pedido enviado
// =============================================================

function renderOrderShippedEmail(string $name, string $orderId): string {
    $shortId = substr($orderId, 0, 8);
    $body = emailHeader("¡Tu pedido está en camino!") . "
    <div class='body'>
        <p>Hola <strong>$name</strong>,</p>
        <p>Tu pedido <strong>#$shortId</strong> ha sido despachado y está en camino a tu dirección.</p>
        <p>El tiempo estimado de entrega depende de tu región:</p>
        <p>
            🏙️ <strong>Región Metropolitana:</strong> 2-4 días hábiles<br>
            🏞️ <strong>Regiones:</strong> 4-7 días hábiles<br>
            🗺️ <strong>Zonas extremas:</strong> 7-12 días hábiles
        </p>
        <div style='text-align:center;margin:20px 0'>
            <a href='https://discretasex.cl/order-status?order=" . urlencode($orderId) . "' class='btn'>Seguir pedido</a>
        </div>
        <hr class='divider'>
        <p class='footer-text'>Recuerda que el embalaje es completamente discreto — sin logos ni referencias al contenido.</p>
    </div>";
    return emailWrapper($body);
}

function sendOrderShippedEmail(string $to, string $name, string $orderId): void {
    $subject = "DiscretaStore — Pedido #" . substr($orderId, 0, 8) . " enviado";
    $html = renderOrderShippedEmail($name, $orderId);
    sendEmail($to, $subject, $html);
}

// =============================================================
// 6. Pedido cancelado
// =============================================================

function renderOrderCancelledEmail(string $name, string $orderId): string {
    $shortId = substr($orderId, 0, 8);
    $body = emailHeader("Pedido cancelado") . "
    <div class='body'>
        <p>Hola <strong>$name</strong>,</p>
        <p>Tu pedido <strong>#$shortId</strong> ha sido cancelado.</p>
        <p>Si realizaste un pago, el reembolso se procesará automáticamente en un plazo de 5-7 días hábiles según el método de pago utilizado.</p>
        <p>Si tienes dudas, escríbenos a <a href='mailto:hola@discretastore.cl' style='color:#e94e8a'>hola@discretastore.cl</a> y te ayudaremos.</p>
        <div style='text-align:center;margin:20px 0'>
            <a href='https://discretasex.cl/products' class='btn'>Seguir comprando</a>
        </div>
    </div>";
    return emailWrapper($body);
}

function sendOrderCancelledEmail(string $to, string $name, string $orderId): void {
    $subject = "DiscretaStore — Pedido #" . substr($orderId, 0, 8) . " cancelado";
    $html = renderOrderCancelledEmail($name, $orderId);
    sendEmail($to, $subject, $html);
}
