-- Registra un archivo ya subido a S3/Blob (solo se guarda su URL publica).
DROP FUNCTION IF EXISTS sp_registrar_archivo(INT, VARCHAR, VARCHAR, VARCHAR);
CREATE FUNCTION sp_registrar_archivo(p_user_id INT, p_name VARCHAR, p_type VARCHAR, p_url VARCHAR)
RETURNS TABLE (id INT, name VARCHAR, type VARCHAR, url VARCHAR, created_at TEXT)
LANGUAGE sql AS $$
  INSERT INTO files AS f (user_id, name, type, url)
  VALUES (p_user_id, p_name, p_type, p_url)
  RETURNING f.id, f.name, f.type, f.url,
            to_char(f.created_at, 'YYYY-MM-DD"T"HH24:MI:SS');
$$;
