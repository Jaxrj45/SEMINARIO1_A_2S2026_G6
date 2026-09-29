-- =====================================================
-- TaskFlow + CloudDrive - Esquema PostgreSQL (Amazon RDS)
-- Orden de ejecucion: schema.sql -> sps/*.sql  (o: psql -f init.sql)
-- =====================================================

-- crypt() y gen_salt() para guardar las contrasenas con bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id                SERIAL PRIMARY KEY,
  username          VARCHAR(50)  NOT NULL UNIQUE,
  email             VARCHAR(120) NOT NULL,
  password_hash     VARCHAR(100) NOT NULL,             -- bcrypt, nunca texto plano
  profile_image_url VARCHAR(500),                      -- solo la URL, nunca la imagen
  created_at        TIMESTAMP(0) NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  user_id     INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  completed   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP(0) NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

CREATE TABLE IF NOT EXISTS files (
  id         SERIAL PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  type       VARCHAR(20)  NOT NULL CHECK (type IN ('image', 'text', 'other')),
  url        VARCHAR(500) NOT NULL,
  created_at TIMESTAMP(0) NOT NULL DEFAULT (now() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
