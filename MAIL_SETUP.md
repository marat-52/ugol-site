# 📧 Настройка отправки заявок на почту — MAIL_SETUP.md

## Как это работает

Когда пользователь отправляет форму, `submit.php` сохраняет заявку в БД.
Если включена почта — скрипт также отправляет красивое HTML-письмо на ваш email.
Для отправки используется **PHPMailer** — самая надёжная библиотека для PHP.

---

## Шаг 1 — Установить PHPMailer

### Если есть Composer (рекомендуется):
```bash
# В корне проекта:
composer require phpmailer/phpmailer
```
Появится папка `vendor/`. Добавьте в начало `submit.php`:
```php
require_once __DIR__ . '/vendor/autoload.php';
```

### Если Composer недоступен (хостинг без SSH):
1. Скачайте архив: https://github.com/PHPMailer/PHPMailer/releases
2. Распакуйте папку `src/` в ваш проект как `phpmailer/src/`
3. Добавьте в `submit.php` вместо autoload:
```php
use PHPMailer\PHPMailer\PHPMailer;
require_once __DIR__ . '/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/phpmailer/src/SMTP.php';
require_once __DIR__ . '/phpmailer/src/Exception.php';
```

---

## Шаг 2 — Настроить config.php

Откройте `config.php` и заполните:
```php
define('MAIL_ENABLED', true);           // ← включить отправку
define('MAIL_TO',      'boss@company.ru');  // ← ваш email для получения заявок
define('MAIL_FROM',    'no-reply@your-site.ru');
define('MAIL_FROM_NAME', 'БерёзаУголь — Заявки');
```

---

## Шаг 3 — Выбрать почтовый сервис

### 🟡 Яндекс Почта (рекомендуется для РФ)

1. Войдите на https://mail.yandex.ru
2. Настройки → Безопасность → **Пароли приложений** → Создать пароль
3. Скопируйте сгенерированный пароль (показывается один раз!)

```php
define('SMTP_HOST',   'smtp.yandex.ru');
define('SMTP_PORT',   465);
define('SMTP_SECURE', 'ssl');
define('SMTP_USER',   'your@yandex.ru');
define('SMTP_PASS',   'xxxx xxxx xxxx xxxx');  // пароль приложения
```

---

### 🔵 Mail.ru / Biz.mail.ru

1. Настройки → Безопасность → **Пароли для внешних приложений** → Добавить
2. Скопируйте пароль

```php
define('SMTP_HOST',   'smtp.mail.ru');
define('SMTP_PORT',   465);
define('SMTP_SECURE', 'ssl');
define('SMTP_USER',   'your@mail.ru');
define('SMTP_PASS',   'app_password_here');
```

---

### 🔴 Gmail

> ⚠️ Gmail требует двухфакторную аутентификацию и пароль приложения.

1. Включите 2FA: https://myaccount.google.com/security
2. Перейдите: https://myaccount.google.com/apppasswords
3. Создайте пароль для «Почта» + «Другое устройство»

```php
define('SMTP_HOST',   'smtp.gmail.com');
define('SMTP_PORT',   587);
define('SMTP_SECURE', 'tls');
define('SMTP_USER',   'your@gmail.com');
define('SMTP_PASS',   'abcd efgh ijkl mnop');  // 16-символьный пароль
```

---

### 🏢 Корпоративный SMTP (хостинг)

Если у вас почта на хостинге (например, `info@birchcoal.ru`):

```php
define('SMTP_HOST',   'mail.birchcoal.ru');  // спросите у хостинга
define('SMTP_PORT',   465);
define('SMTP_SECURE', 'ssl');
define('SMTP_USER',   'info@birchcoal.ru');
define('SMTP_PASS',   'your_mailbox_password');
```

Настройки SMTP ищите в:
- cPanel → Email Accounts → Connect Devices
- ISPmanager → Почта → Настройки
- или в письме «Добро пожаловать» от хостинга

---

## Шаг 4 — Проверить

Откройте в браузере тестовую страницу (создайте файл `test_mail.php`):

```php
<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/vendor/autoload.php'; // или ручные require

use PHPMailer\PHPMailer\PHPMailer;

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = SMTP_SECURE;
    $mail->Port       = SMTP_PORT;
    $mail->CharSet    = 'UTF-8';
    $mail->setFrom(MAIL_FROM, MAIL_FROM_NAME);
    $mail->addAddress(MAIL_TO);
    $mail->Subject = 'Тест PHPMailer';
    $mail->Body    = 'Если вы видите это — почта работает! 🔥';
    $mail->send();
    echo 'Письмо отправлено на ' . MAIL_TO;
} catch (Exception $e) {
    echo 'Ошибка: ' . $mail->ErrorInfo;
}
```

❗ **Удалите `test_mail.php` после проверки!**

---

## Частые ошибки

| Ошибка | Причина | Решение |
|--------|---------|---------|
| `SMTP connect() failed` | Неверный хост или порт | Проверьте SMTP_HOST и SMTP_PORT |
| `SMTP AUTH failed` | Неверный логин/пароль | Используйте пароль приложения, не обычный |
| `Could not authenticate` | Gmail: нет 2FA или пароля приложения | Включите 2FA и создайте App Password |
| `Connection timed out` | Хостинг блокирует исходящий SMTP | Используйте порт хостинга или `mail()` |
| Письма в спаме | Нет SPF/DKIM | Настройте DNS-записи у регистратора |

---

## Альтернатива: PHP mail() (простейший вариант)

Если хостинг поддерживает функцию `mail()` (большинство виртуальных хостингов):

Замените в `submit.php` вызов `sendOrderEmail()` на:
```php
$subject = "=?UTF-8?B?" . base64_encode("Новая заявка #{$orderId} от {$name}") . "?=";
$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "From: =?UTF-8?B?" . base64_encode('БерёзаУголь') . "?= <noreply@your-site.ru>\r\n";

$body = "Имя: {$name}\nТелефон: {$phone}\nEmail: {$email}\nОбъём: {$volume}";
mail(MAIL_TO, $subject, $body, $headers);
```
> Минус: письма часто попадают в спам. PHPMailer + SMTP надёжнее.

---

## Структура файлов после настройки

```
birch-coal/
├── index.html
├── style.css
├── script.js
├── config.php          ← настройки БД и SMTP
├── submit.php          ← обработчик формы
├── database.sql        ← схема БД для phpMyAdmin
├── MAIL_SETUP.md       ← этот файл
└── vendor/             ← PHPMailer (после composer install)
    └── autoload.php
```
