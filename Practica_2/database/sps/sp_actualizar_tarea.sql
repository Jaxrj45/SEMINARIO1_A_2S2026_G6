-- Edita titulo y/o descripcion de una tarea del usuario.
--   p_title NULL            -> conserva el titulo
--   p_set_description FALSE -> conserva la descripcion (TRUE permite guardar NULL a proposito)
DROP FUNCTION IF EXISTS sp_actualizar_tarea(INT, INT, VARCHAR, TEXT, BOOLEAN);
CREATE FUNCTION sp_actualizar_tarea(
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
