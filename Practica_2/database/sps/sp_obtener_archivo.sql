-- Un archivo, solo si pertenece al usuario (si no, cero filas -> 404).
CREATE OR REPLACE FUNCTION sp_obtener_archivo(p_id INT, p_user_id INT)
RETURNS TABLE (id INT, name VARCHAR, type VARCHAR, url VARCHAR, created_at TEXT)
LANGUAGE sql AS $$
  SELECT f.id, f.name, f.type, f.url,
         to_char(f.created_at, 'YYYY-MM-DD"T"HH24:MI:SS')
  FROM files f
  WHERE f.id = p_id AND f.user_id = p_user_id;
$$;
