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
