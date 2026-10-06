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
