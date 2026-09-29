-- Tareas del usuario, mas recientes primero. created_at en ISO 8601 (UTC).
DROP FUNCTION IF EXISTS sp_listar_tareas(INT);
CREATE FUNCTION sp_listar_tareas(p_user_id INT)
RETURNS TABLE (id INT, title VARCHAR, description TEXT, completed BOOLEAN, created_at TEXT)
LANGUAGE sql AS $$
  SELECT t.id, t.title, t.description, t.completed,
         to_char(t.created_at, 'YYYY-MM-DD"T"HH24:MI:SS')
  FROM tasks t
  WHERE t.user_id = p_user_id
  ORDER BY t.created_at DESC, t.id DESC;
$$;
