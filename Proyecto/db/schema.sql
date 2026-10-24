-- =====================================================
-- Semi-Social - Esquema MySQL 8 (Amazon RDS)
-- Orden de ejecucion: schema.sql -> seed.sql
-- Todas las fechas se guardan en UTC
-- =====================================================

CREATE DATABASE IF NOT EXISTS semisocial
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE semisocial;

-- -----------------------------------------------------
-- Usuarios
-- Cognito maneja la cuenta; aqui se guarda lo que usa la app.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cognito_sub     CHAR(36)     NOT NULL,                  -- id del usuario en Cognito
  username        VARCHAR(50)  NOT NULL,
  nombre_completo VARCHAR(150) NOT NULL,
  email           VARCHAR(150) NOT NULL,
  dpi             CHAR(13)     NOT NULL,
  password_md5    CHAR(32)     NOT NULL,                  -- MD5, lo pide la rubrica
  foto_key        VARCHAR(255) NOT NULL,                  -- ej. Fotos_Perfil/21bc-ana.jpg
  creado_en       DATETIME     NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_cognito_sub (cognito_sub),
  UNIQUE KEY uq_usuarios_username (username),
  UNIQUE KEY uq_usuarios_email (email),
  UNIQUE KEY uq_usuarios_dpi (dpi),
  CONSTRAINT ck_usuarios_dpi CHECK (dpi REGEXP '^[0-9]{13}$')
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Amistades (tambien guarda las solicitudes)
-- Una sola fila por pareja: si A le manda a B, B ya no puede mandarle a A.
-- Si una solicitud fue rechazada y se vuelve a mandar, se actualiza esa fila.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS amistades (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  solicitante_id  INT UNSIGNED NOT NULL,
  destinatario_id INT UNSIGNED NOT NULL,
  estado          ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  creado_en       DATETIME     NOT NULL DEFAULT (UTC_TIMESTAMP()),
  respondido_en   DATETIME     NULL,
  -- la pareja ordenada, para que A->B y B->A sean la misma
  usuario_menor   INT UNSIGNED AS (LEAST(solicitante_id, destinatario_id)) STORED,
  usuario_mayor   INT UNSIGNED AS (GREATEST(solicitante_id, destinatario_id)) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_amistades_pareja (usuario_menor, usuario_mayor),
  KEY idx_amistades_solicitante (solicitante_id, estado),
  KEY idx_amistades_destinatario (destinatario_id, estado),
  CONSTRAINT fk_amistades_solicitante  FOREIGN KEY (solicitante_id)  REFERENCES usuarios (id),
  CONSTRAINT fk_amistades_destinatario FOREIGN KEY (destinatario_id) REFERENCES usuarios (id),
  CONSTRAINT ck_amistades_distintos CHECK (usuario_menor <> usuario_mayor)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Publicaciones
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS publicaciones (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED  NOT NULL,
  descripcion VARCHAR(1000) NULL,                         -- opcional
  imagen_key  VARCHAR(255)  NOT NULL,                     -- ej. Fotos_Publicadas/8f3a-playa.jpg
  creado_en   DATETIME      NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (id),
  KEY idx_publicaciones_usuario_fecha (usuario_id, creado_en),
  CONSTRAINT fk_publicaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Etiquetas que devuelve Rekognition (en ingles, ej. Beach)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS etiquetas (
  id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_etiquetas_nombre (nombre)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS publicacion_etiquetas (
  publicacion_id INT UNSIGNED NOT NULL,
  etiqueta_id    INT UNSIGNED NOT NULL,
  PRIMARY KEY (publicacion_id, etiqueta_id),
  KEY idx_publicacion_etiquetas_etiqueta (etiqueta_id),
  CONSTRAINT fk_pe_publicacion FOREIGN KEY (publicacion_id) REFERENCES publicaciones (id) ON DELETE CASCADE,
  CONSTRAINT fk_pe_etiqueta    FOREIGN KEY (etiqueta_id)    REFERENCES etiquetas (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Comentarios
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS comentarios (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  publicacion_id INT UNSIGNED  NOT NULL,
  usuario_id     INT UNSIGNED  NOT NULL,
  texto          VARCHAR(1000) NOT NULL,
  creado_en      DATETIME      NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (id),
  KEY idx_comentarios_publicacion_fecha (publicacion_id, creado_en),
  CONSTRAINT fk_comentarios_publicacion FOREIGN KEY (publicacion_id) REFERENCES publicaciones (id) ON DELETE CASCADE,
  CONSTRAINT fk_comentarios_usuario     FOREIGN KEY (usuario_id)     REFERENCES usuarios (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- -----------------------------------------------------
-- Mensajes del chat
-- Cada EC2 busca los mensajes con id mayor al ultimo que ya mando.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS mensajes (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  emisor_id   INT UNSIGNED  NOT NULL,
  receptor_id INT UNSIGNED  NOT NULL,
  texto       VARCHAR(2000) NOT NULL,
  creado_en   DATETIME      NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (id),
  KEY idx_mensajes_emisor_receptor (emisor_id, receptor_id, id),
  KEY idx_mensajes_receptor_emisor (receptor_id, emisor_id, id),
  CONSTRAINT fk_mensajes_emisor   FOREIGN KEY (emisor_id)   REFERENCES usuarios (id),
  CONSTRAINT fk_mensajes_receptor FOREIGN KEY (receptor_id) REFERENCES usuarios (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
