-- Una tarea, solo si pertenece al usuario (si no, cero filas -> 404).
CREATE OR REPLACE FUNCTION sp_obtener_tarea(p_id INT, p_user_id INT)
RETURNS TABLE (id INT, title VARCHAR, description TEXT, completed BOOLEAN, created_at TEXT)
LANGUAGE sql AS $$
  SELECT t.id, t.title, t.description, t.completed,
         to_char(t.created_at, 'YYYY-MM-DD"T"HH24:MI:SS')
  FROM tasks t
  WHERE t.id = p_id AND t.user_id = p_user_id;
$$;
