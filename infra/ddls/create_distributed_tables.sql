-- Idempotent DDL para crear las tablas distribuidas necesarias: outbox y refresh_tokens
-- Ejecutar con un usuario que tenga privilegios DDL (CREATE, ALTER, INDEX)

SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS `outbox` (
  `id` varchar(36) NOT NULL,
  `aggregate_type` varchar(100) NOT NULL,
  `aggregate_id` varchar(36) NOT NULL,
  `event_type` varchar(150) NOT NULL,
  `payload` JSON NOT NULL,
  `status` enum('pending','processing','sent','failed','dlq') NOT NULL DEFAULT 'pending',
  `attempts` int NOT NULL DEFAULT 0,
  `max_attempts` smallint NOT NULL DEFAULT 5,
  `next_run_at` datetime NULL,
  `locked_until` datetime NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `tenant_id` varchar(36) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_outbox_status` (`status`),
  KEY `idx_outbox_next_run` (`next_run_at`),
  KEY `idx_outbox_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `token_hash` varchar(128) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `revoked_at` datetime(6) NULL,
  `replaced_by_token_hash` varchar(128) NULL,
  `tenant_id` varchar(36) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_refresh_token_hash` (`token_hash`),
  KEY `idx_refresh_user` (`user_id`),
  KEY `idx_refresh_expires` (`expires_at`),
  KEY `idx_refresh_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;

-- Nota: adapte tipos/longitudes si su entorno requiere otras convenciones.
