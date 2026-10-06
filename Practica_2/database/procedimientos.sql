-- =====================================================
-- TaskFlow + CloudDrive - Stored procedures (PostgreSQL)
-- Ejecutar conectado a la base 'taskflow', despues de schema.sql.
-- En DataGrip: abrir este archivo, elegir la base 'taskflow' y ejecutar todo.
-- Se puede volver a ejecutar: cada SP usa CREATE OR REPLACE.
-- =====================================================

-- -----------------------------------------------------
-- sp_registrar_usuario
-- -----------------------------------------------------
-- Registra un usuario. La contrasena llega en texto y se guarda con bcrypt (pgcrypto).
-- Si el username ya existe lanza unique_violation (23505) -> el backend responde 409.
CREATE OR REPLACE FUNCTION sp_registrar_usuario(
  p_username          VARCHAR,
  p_email             VARCHAR,
  p_password          VARCHAR,
  p_profile_image_url VARCHAR
)
RETURNS TABLE (id INT, username VARCHAR, email VARCHAR, profile_image_url VARCHAR)
LANGUAGE sql AS $$
  INSERT INTO users AS u (username, email, password_hash, profile_image_url)
  VALUES (p_username, p_email, crypt(p_password, gen_salt('bf', 10)), p_profile_image_url)
  RETURNING u.id, u.username, u.email, u.profile_image_url;
$$;

-- -----------------------------------------------------
-- sp_login
-- -----------------------------------------------------
-- Devuelve el usuario solo si la contrasena coincide con el hash; si no, cero filas (-> 401).
CREATE OR REPLACE FUNCTION sp_login(p_username VARCHAR, p_password VARCHAR)
RETURNS TABLE (id INT, username VARCHAR, email VARCHAR, profile_image_url VARCHAR)
LANGUAGE sql AS $$
  SELECT u.id, u.username, u.email, u.profile_image_url
  FROM users u
  WHERE u.username = p_username
    AND u.password_hash = crypt(p_password, u.password_hash);
$$;

-- -----------------------------------------------------
-- sp_listar_tareas
-- -----------------------------------------------------
-- Tareas del usuario, mas recientes primero. created_at en ISO 8601 (UTC).
CREATE OR REPLACE FUNCTION sp_listar_tareas(p_user_id INT)
RETURNS TABLE (id INT, title VARCHAR, description TEXT, completed BOOLEAN, created_at TEXT)
LANGUAGE sql AS $$
  SELECT t.id, t.title, t.description, t.completed,
         to_char(t.created_at, 'YYYY-MM-DD"T"HH24:MI:SS')
  FROM tasks t
  WHERE t.user_id = p_user_id
  ORDER BY t.created_at DESC, t.id DESC;
$$;

-- -----------------------------------------------------
-- sp_obtener_tarea
-- -----------------------------------------------------
-- Una tarea, solo si pertenece al usuario (si no, cero filas -> 404).
CREATE OR REPLACE FUNCTION sp_obtener_tarea(p_id INT, p_user_id INT)
RETURNS TABLE (id INT, title VARCHAR, description TEXT, completed BOOLEAN, created_at TEXT)
LANGUAGE sql AS $$
  SELECT t.id, t.title, t.description, t.completed,
         to_char(t.created_at, 'YYYY-MM-DD"T"HH24:MI:SS')
  FROM tasks t
  WHERE t.id = p_id AND t.user_id = p_user_id;
$$;

-- -----------------------------------------------------
-- sp_crear_tarea
-- -----------------------------------------------------
-- Crea una tarea; la fecha de creacion se genera automaticamente.
CREATE OR REPLACE FUNCTION sp_crear_tarea(p_user_id INT, p_title VARCHAR, p_description TEXT)
RETURNS TABLE (id INT, title VARCHAR, description TEXT, completed BOOLEAN, created_at TEXT)
LANGUAGE sql AS $$
  INSERT INTO tasks AS t (user_id, title, description)
  VALUES (p_user_id, p_title, p_description)
  RETURNING t.id, t.title, t.description, t.completed,
            to_char(t.created_at, 'YYYY-MM-DD"T"HH24:MI:SS');
$$;

-- -----------------------------------------------------
-- sp_actualizar_tarea
-- -----------------------------------------------------
-- Edita titulo y/o descripcion de una tarea del usuario.
--   p_title NULL            -> conserva el titulo
--   p_set_description FALSE -> conserva la descripcion (TRUE permite guardar NULL a proposito)
CREATE OR REPLACE FUNCTION sp_actualizar_tarea(
  p_id              INT,
  p_user_id         INT,
  p_title           VARCHAR,
  p_description     TEXT,
  p_set_description BOOLEAN
)
RETURNS TABLE (id INT, title VARCHAR, description TEXT, completed BOOLEAN, created_at TEXT)
LANGUAGE sql AS $$
  UPDATE tasks AS t
  SET title       = COALESCE(p_title, t.title),
      description = CASE WHEN p_set_description THEN p_description ELSE t.description END
  WHERE t.id = p_id AND t.user_id = p_user_id
  RETURNING t.id, t.title, t.description, t.completed,
            to_char(t.created_at, 'YYYY-MM-DD"T"HH24:MI:SS');
$$;

-- -----------------------------------------------------
-- sp_marcar_tarea
-- -----------------------------------------------------
-- Marca o desmarca como completada. p_completed NULL -> alterna el estado actual.
CREATE OR REPLACE FUNCTION sp_marcar_tarea(p_id INT, p_user_id INT, p_completed BOOLEAN)
RETURNS TABLE (id INT, title VARCHAR, description TEXT, completed BOOLEAN, created_at TEXT)
LANGUAGE sql AS $$
  UPDATE tasks AS t
  SET completed = COALESCE(p_completed, NOT t.completed)
  WHERE t.id = p_id AND t.user_id = p_user_id
  RETURNING t.id, t.title, t.description, t.completed,
            to_char(t.created_at, 'YYYY-MM-DD"T"HH24:MI:SS');
$$;

-- -----------------------------------------------------
-- sp_eliminar_tarea
-- -----------------------------------------------------
-- Elimina una tarea del usuario. deleted = FALSE si no existia o era de otro usuario (-> 404).
CREATE OR REPLACE FUNCTION sp_eliminar_tarea(p_id INT, p_user_id INT)
RETURNS TABLE (deleted BOOLEAN)
LANGUAGE sql AS $$
  WITH d AS (
    DELETE FROM tasks t
    WHERE t.id = p_id AND t.user_id = p_user_id
    RETURNING 1
  )
  SELECT count(*) > 0 FROM d;
$$;

-- -----------------------------------------------------
-- sp_listar_archivos
-- -----------------------------------------------------
-- Archivos del usuario, mas recientes primero. created_at en ISO 8601 (UTC).
CREATE OR REPLACE FUNCTION sp_listar_archivos(p_user_id INT)
RETURNS TABLE (id INT, name VARCHAR, type VARCHAR, url VARCHAR, created_at TEXT)
LANGUAGE sql AS $$
  SELECT f.id, f.name, f.type, f.url,
         to_char(f.created_at, 'YYYY-MM-DD"T"HH24:MI:SS')
  FROM files f
  WHERE f.user_id = p_user_id
  ORDER BY f.created_at DESC, f.id DESC;
$$;

-- -----------------------------------------------------
-- sp_obtener_archivo
-- -----------------------------------------------------
-- Un archivo, solo si pertenece al usuario (si no, cero filas -> 404).
CREATE OR REPLACE FUNCTION sp_obtener_archivo(p_id INT, p_user_id INT)
RETURNS TABLE (id INT, name VARCHAR, type VARCHAR, url VARCHAR, created_at TEXT)
LANGUAGE sql AS $$
  SELECT f.id, f.name, f.type, f.url,
         to_char(f.created_at, 'YYYY-MM-DD"T"HH24:MI:SS')
  FROM files f
  WHERE f.id = p_id AND f.user_id = p_user_id;
$$;

-- -----------------------------------------------------
-- sp_registrar_archivo
-- -----------------------------------------------------
-- Registra un archivo ya subido a S3/Blob (solo se guarda su URL publica).
CREATE OR REPLACE FUNCTION sp_registrar_archivo(p_user_id INT, p_name VARCHAR, p_type VARCHAR, p_url VARCHAR)
RETURNS TABLE (id INT, name VARCHAR, type VARCHAR, url VARCHAR, created_at TEXT)
LANGUAGE sql AS $$
  INSERT INTO files AS f (user_id, name, type, url)
  VALUES (p_user_id, p_name, p_type, p_url)
  RETURNING f.id, f.name, f.type, f.url,
            to_char(f.created_at, 'YYYY-MM-DD"T"HH24:MI:SS');
$$;
