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
