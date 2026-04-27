<?php
/**
 * БерёзаУголь — Form Handler
 * Файл: submit.php
 *
 * Принимает POST-запрос из формы, сохраняет заявку в БД
 * и (опционально) отправляет письмо менеджеру.
 *
 * Требования: PHP 7.4+, PDO с драйвером MySQL.
 * Для email: composer require phpmailer/phpmailer
 */

declare(strict_types=1);

// ---------- CORS / Headers ----------
header('Content-Type: application/json; charset=utf-8');

// Разрешить запросы только со своего домена:
// header('Access-Control-Allow-Origin: https://your-domain.ru');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---------- Только POST ----------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
    exit;
}

// ---------- Подключить конфиг ----------
require_once __DIR__ . '/config.php';

// ---------- Считать и очистить данные ----------
function clean(?string $val): ?string {
    if ($val === null || trim($val) === '') return null;
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}

$name        = clean($_POST['fname']       ?? null);
$company     = clean($_POST['company']     ?? null);
$phone       = clean($_POST['phone']       ?? null);
$email       = clean($_POST['email']       ?? null);
$volume      = clean($_POST['volume']      ?? null);
$clientType  = clean($_POST['client_type'] ?? null);
$comment     = clean($_POST['comment']     ?? null);

// ---------- Серверная валидация ----------
$errors = [];

if (empty($name)) {
    $errors['fname'] = 'Имя обязательно';
}

$phoneDigits = preg_replace('/\D/', '', $phone ?? '');
$emailValid  = $email && filter_var($email, FILTER_VALIDATE_EMAIL);

if (strlen($phoneDigits) < 11 && !$emailValid) {
    if (!$phone && !$email) {
        $errors['phone'] = 'Укажите телефон или email';
    } elseif ($phone && strlen($phoneDigits) < 11) {
        $errors['phone'] = 'Введите корректный номер телефона';
    }
    if ($email && !$emailValid) {
        $errors['email'] = 'Введите корректный email';
    }
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'errors' => $errors]);
    exit;
}

// ---------- Простая защита от спама (rate limiting по IP) ----------
$ip        = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ip        = explode(',', $ip)[0];
$userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500);

// ---------- Сохранить в БД ----------
try {
    $pdo = getDB();

    // Проверяем: не было ли заявки с этого телефона/email за последние 10 минут
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM orders
         WHERE (phone = :phone OR email = :email)
           AND created_at > DATE_SUB(NOW(), INTERVAL 10 MINUTE)'
    );
    $stmt->execute([':phone' => $phone, ':email' => $email]);
    if ((int)$stmt->fetchColumn() > 0) {
        http_response_code(429);
        echo json_encode(['ok' => false, 'error' => 'Вы уже отправляли заявку. Подождите несколько минут.']);
        exit;
    }

    // Вставить заявку
    $insert = $pdo->prepare(
        'INSERT INTO orders
             (name, company, phone, email, volume, client_type, comment, ip_address, user_agent)
         VALUES
             (:name, :company, :phone, :email, :volume, :client_type, :comment, :ip, :ua)'
    );
    $insert->execute([
        ':name'        => $name,
        ':company'     => $company,
        ':phone'       => $phone,
        ':email'       => $email,
        ':volume'      => $volume,
        ':client_type' => $clientType,
        ':comment'     => $comment,
        ':ip'          => $ip,
        ':ua'          => $userAgent,
    ]);

    $orderId = (int)$pdo->lastInsertId();

} catch (PDOException $e) {
    // В продакшн-логах не показываем детали ошибки клиенту
    error_log('[BirchCoal] DB error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Ошибка базы данных. Попробуйте позже.']);
    exit;
}

// ---------- Отправить email (если включено) ----------
$mailSent = false;

if (defined('MAIL_ENABLED') && MAIL_ENABLED) {
    $mailSent = sendOrderEmail($orderId, $name, $company, $phone, $email, $volume, $clientType, $comment);
}

// ---------- Успешный ответ ----------
echo json_encode([
    'ok'       => true,
    'order_id' => $orderId,
    'message'  => 'Заявка принята. Менеджер свяжется с вами в течение 30 минут.',
    'mail_sent'=> $mailSent,
]);
exit;


// ============================================================
// ФУНКЦИЯ ОТПРАВКИ EMAIL (PHPMailer)
// Раскомментируйте и настройте после установки PHPMailer:
//   composer require phpmailer/phpmailer
// ============================================================

function sendOrderEmail(
    int $orderId, ?string $name, ?string $company,
    ?string $phone, ?string $email,
    ?string $volume, ?string $clientType, ?string $comment
): bool {
    // Если PHPMailer не установлен — пропускаем
    if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
        error_log('[BirchCoal] PHPMailer not found. Run: composer require phpmailer/phpmailer');
        return false;
    }

    try {
        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);

        // SMTP
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        $mail->SMTPSecure = SMTP_SECURE;
        $mail->Port       = SMTP_PORT;
        $mail->CharSet    = 'UTF-8';

        // От кого / кому
        $mail->setFrom(MAIL_FROM, MAIL_FROM_NAME);
        $mail->addAddress(MAIL_TO);

        // Тема
        $mail->Subject = "🔥 Новая заявка #{$orderId} — {$name}" . ($company ? " ({$company})" : '');

        // HTML-тело письма
        $mail->isHTML(true);
        $mail->Body = buildEmailHtml($orderId, $name, $company, $phone, $email, $volume, $clientType, $comment);
        $mail->AltBody = buildEmailText($orderId, $name, $company, $phone, $email, $volume, $clientType, $comment);

        $mail->send();
        return true;

    } catch (\Exception $e) {
        error_log('[BirchCoal] Mail error: ' . $e->getMessage());
        return false;
    }
}

function buildEmailHtml(
    int $orderId, ?string $name, ?string $company,
    ?string $phone, ?string $email,
    ?string $volume, ?string $clientType, ?string $comment
): string {
    $rows = [
        '№ заявки'           => "#{$orderId}",
        'Имя'                => $name ?? '—',
        'Компания'           => $company ?? '—',
        'Телефон'            => $phone ?? '—',
        'Email'              => $email ?? '—',
        'Объём (мешки/мес)'  => $volume ?? '—',
        'Тип клиента'        => $clientType ?? '—',
        'Комментарий'        => nl2br($comment ?? '—'),
        'Дата'               => date('d.m.Y H:i'),
    ];

    $tbody = '';
    foreach ($rows as $label => $val) {
        $tbody .= "<tr>
            <td style='padding:8px 14px;background:#1a1a1a;color:#8a8070;font-weight:600;white-space:nowrap;border:1px solid #2a2a2a;'>{$label}</td>
            <td style='padding:8px 14px;background:#111;color:#e8e0d5;border:1px solid #2a2a2a;'>{$val}</td>
        </tr>";
    }

    return <<<HTML
<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#161616;border:1px solid rgba(232,66,10,0.25);border-radius:6px;overflow:hidden;">
    <div style="background:#e8420a;padding:20px 24px;">
      <h2 style="color:#fff;margin:0;font-size:20px;">🔥 Новая заявка с сайта БерёзаУголь</h2>
    </div>
    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">{$tbody}</table>
    </div>
    <div style="padding:14px 24px;background:#0a0a0a;color:#555;font-size:12px;">
      Письмо сгенерировано автоматически. Войдите в phpMyAdmin для просмотра всех заявок.
    </div>
  </div>
</body>
</html>
HTML;
}

function buildEmailText(
    int $orderId, ?string $name, ?string $company,
    ?string $phone, ?string $email,
    ?string $volume, ?string $clientType, ?string $comment
): string {
    return implode("\n", [
        "НОВАЯ ЗАЯВКА #{$orderId} — БерёзаУголь",
        str_repeat('=', 40),
        "Имя:          {$name}",
        "Компания:     " . ($company ?? '—'),
        "Телефон:      " . ($phone ?? '—'),
        "Email:        " . ($email ?? '—'),
        "Объём:        " . ($volume ?? '—'),
        "Тип клиента:  " . ($clientType ?? '—'),
        "Комментарий:  " . ($comment ?? '—'),
        "Дата:         " . date('d.m.Y H:i'),
    ]);
}
