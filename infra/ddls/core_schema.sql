-- Canonical schema DDL for ArisGourmet (MySQL, InnoDB, utf8mb4)
-- Source of truth: DB (singular table names, varchar(36) ids)

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS restaurante (
  id VARCHAR(36) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  direccion VARCHAR(255) NULL,
  telefono VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS role (
  id VARCHAR(36) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UQ_role_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS permiso (
  id VARCHAR(36) NOT NULL,
  clave VARCHAR(255) NOT NULL,
  descripcion VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UQ_permiso_clave (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS role_permisos (
  roleId VARCHAR(36) NOT NULL,
  permisoId VARCHAR(36) NOT NULL,
  PRIMARY KEY (roleId, permisoId),
  INDEX IDX_role (roleId),
  INDEX IDX_permiso (permisoId),
  CONSTRAINT FK_role_permisos_role FOREIGN KEY (roleId) REFERENCES role(id) ON DELETE CASCADE,
  CONSTRAINT FK_role_permisos_permiso FOREIGN KEY (permisoId) REFERENCES permiso(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS usuario (
  id VARCHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('cliente','cocina','host','admin') NOT NULL DEFAULT 'cliente',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  restaurante_id VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY IDX_usuario_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mesa (
  id VARCHAR(36) NOT NULL,
  codigo_qr VARCHAR(255) NOT NULL,
  estado ENUM('libre','ocupada','activa','inactiva','liberada') NOT NULL DEFAULT 'libre',
  ultima_actividad_at DATETIME NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  ocupado TINYINT NOT NULL DEFAULT 0,
  ocupado_desde TIMESTAMP NULL,
  restaurante_id VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY IDX_mesa_codigo_qr (codigo_qr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS mesa_sesion (
  id VARCHAR(36) NOT NULL,
  mesa_id VARCHAR(36) NOT NULL,
  cliente_nombre VARCHAR(255) NULL,
  inicio_at DATETIME NULL,
  fin_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX IDX_mesa_sesion_mesa (mesa_id),
  CONSTRAINT FK_mesa_sesion_mesa FOREIGN KEY (mesa_id) REFERENCES mesa(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS producto (
  id VARCHAR(36) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT NULL,
  precio DECIMAL(10,2) NOT NULL,
  disponible TINYINT NOT NULL DEFAULT 1,
  tiempo_base_minutos INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  restaurante_id VARCHAR(255) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pedido (
  id VARCHAR(36) NOT NULL,
  mesa_id VARCHAR(255) NOT NULL,
  estado ENUM('pendiente','aceptado','preparando','listo','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  restaurante_id VARCHAR(255) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS item_pedido (
  id VARCHAR(36) NOT NULL,
  producto_id VARCHAR(255) NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  pedidoId VARCHAR(36) NULL,
  restaurante_id VARCHAR(255) NULL,
  PRIMARY KEY (id),
  INDEX IDX_item_pedido_pedido (pedidoId),
  CONSTRAINT FK_item_pedido_pedido FOREIGN KEY (pedidoId) REFERENCES pedido(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS historial_estado_pedido (
  id VARCHAR(36) NOT NULL,
  pedido_id VARCHAR(36) NOT NULL,
  estado_anterior VARCHAR(255) NOT NULL,
  estado_nuevo VARCHAR(255) NOT NULL,
  nota TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX IDX_historial_pedido (pedido_id),
  CONSTRAINT FK_historial_pedido FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notificacion (
  id VARCHAR(36) NOT NULL,
  tipo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  usuario_id VARCHAR(36) NULL,
  leido TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX IDX_notificacion_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS evento (
  id VARCHAR(36) NOT NULL,
  tipo VARCHAR(255) NOT NULL,
  metadata TEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tiempo (
  id VARCHAR(36) NOT NULL,
  producto_id VARCHAR(255) NOT NULL,
  tiempo_base_minutos INT NOT NULL,
  tiempo_estimado_actual_minutos INT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  restaurante_id VARCHAR(255) NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  replaced_by_token_id BIGINT UNSIGNED NULL,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_refresh_hash (token_hash),
  INDEX idx_refresh_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS outbox (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  aggregate_type VARCHAR(100) NOT NULL,
  aggregate_id VARCHAR(100) NULL,
  event_type VARCHAR(150) NOT NULL,
  payload JSON NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  next_retry_at DATETIME NULL,
  dlq BOOLEAN NOT NULL DEFAULT FALSE,
  dlq_reason TEXT NULL,
  processed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_outbox_pending (processed, dlq, next_retry_at, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
