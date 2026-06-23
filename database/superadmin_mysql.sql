-- Superadmin CMS + Monitoring schema for Astro Portfolio
-- Run this script in your MySQL database (example: portfolio_admin)

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'superadmin',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  session_token VARCHAR(128) NOT NULL,
  ip_address VARCHAR(128) NOT NULL DEFAULT 'unknown',
  user_agent TEXT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_sessions_token (session_token),
  KEY idx_admin_sessions_user (user_id),
  KEY idx_admin_sessions_exp (expires_at),
  CONSTRAINT fk_admin_sessions_user
    FOREIGN KEY (user_id)
    REFERENCES admin_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS site_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(128) NOT NULL,
  setting_value LONGTEXT NOT NULL,
  value_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_site_settings_key (setting_key),
  KEY idx_site_settings_updated_by (updated_by),
  CONSTRAINT fk_site_settings_updated_by
    FOREIGN KEY (updated_by)
    REFERENCES admin_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cms_pages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(128) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content_json LONGTEXT NOT NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cms_pages_slug (slug),
  KEY idx_cms_pages_updated_by (updated_by),
  CONSTRAINT fk_cms_pages_updated_by
    FOREIGN KEY (updated_by)
    REFERENCES admin_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS monitoring_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(128) NOT NULL,
  source VARCHAR(128) NOT NULL,
  message TEXT NOT NULL,
  level ENUM('info', 'warning', 'error') NOT NULL DEFAULT 'info',
  payload_json LONGTEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_monitoring_events_user (user_id),
  KEY idx_monitoring_events_created (created_at),
  KEY idx_monitoring_events_type (event_type),
  CONSTRAINT fk_monitoring_events_user
    FOREIGN KEY (user_id)
    REFERENCES admin_users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default superadmin:
-- username: fikrihaikal17
-- password: 386776Haikal
INSERT INTO admin_users (username, password_hash, role, is_active)
VALUES (
  'fikrihaikal17',
  '$2b$12$aOwaDCSaKE9QlctTkSgLLeSKVlBR/8Tu8esNgsk/298h3r3G/YuZO',
  'superadmin',
  1
)
ON DUPLICATE KEY UPDATE
  updated_at = CURRENT_TIMESTAMP;

-- Optional initial CMS and settings records
INSERT INTO cms_pages (slug, title, content_json, is_published)
VALUES
  ('home-hero', 'Homepage Hero', '{"headline":"Muhammad Fikri Haikal","subtitle":"Software Engineer - Backend, IoT, Cloud"}', 1),
  ('contact', 'Contact Section', '{"email":"fikri@example.com","cta":"Let us build something"}', 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  content_json = VALUES(content_json),
  is_published = VALUES(is_published),
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO site_settings (setting_key, setting_value, value_type)
VALUES
  ('site_title', 'Muhammad Fikri Haikal | Portfolio', 'string'),
  ('maintenance_mode', 'false', 'boolean'),
  ('analytics_enabled', 'true', 'boolean')
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  value_type = VALUES(value_type),
  updated_at = CURRENT_TIMESTAMP;
