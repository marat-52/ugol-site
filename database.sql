-- ============================================================
-- БерёзаУголь — Database Schema
-- Файл: database.sql
--
-- КАК ИСПОЛЬЗОВАТЬ:
--   1. Откройте phpMyAdmin
--   2. Создайте базу данных: CREATE DATABASE IF NOT EXISTS `birchcoal`
--      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   3. Выберите базу birchcoal
--   4. Нажмите вкладку «SQL» и вставьте весь этот файл → «Выполнить»
-- ============================================================

CREATE DATABASE IF NOT EXISTS `birchcoal`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `birchcoal`;

-- Таблица заявок
CREATE TABLE IF NOT EXISTS `orders` (
  `id`          INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(150)      NOT NULL COMMENT 'Имя клиента',
  `company`     VARCHAR(200)      DEFAULT NULL COMMENT 'Название компании',
  `phone`       VARCHAR(30)       DEFAULT NULL COMMENT 'Телефон',
  `email`       VARCHAR(150)      DEFAULT NULL COMMENT 'Email',
  `volume`      VARCHAR(50)       DEFAULT NULL COMMENT 'Объём в мешках/мес',
  `client_type` VARCHAR(100)      DEFAULT NULL COMMENT 'Тип клиента',
  `comment`     TEXT              DEFAULT NULL COMMENT 'Комментарий',
  `ip_address`  VARCHAR(45)       DEFAULT NULL COMMENT 'IP отправителя',
  `user_agent`  VARCHAR(500)      DEFAULT NULL COMMENT 'User-Agent браузера',
  `status`      ENUM('new','in_progress','done','spam')
                                  NOT NULL DEFAULT 'new' COMMENT 'Статус обработки',
  `created_at`  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_status`     (`status`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_phone`      (`phone`),
  INDEX `idx_email`      (`email`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Заявки с сайта БерёзаУголь';


-- ============================================================
-- Примеры запросов для работы с заявками в phpMyAdmin:
-- ============================================================

-- Все новые заявки, свежие сверху:
-- SELECT id, name, company, phone, email, volume, client_type, created_at
-- FROM orders WHERE status = 'new' ORDER BY created_at DESC;

-- Изменить статус заявки (id = 5) на "в работе":
-- UPDATE orders SET status = 'in_progress' WHERE id = 5;

-- Поиск по телефону:
-- SELECT * FROM orders WHERE phone LIKE '%9031234567%';

-- Статистика по типам клиентов:
-- SELECT client_type, COUNT(*) AS cnt FROM orders GROUP BY client_type ORDER BY cnt DESC;
