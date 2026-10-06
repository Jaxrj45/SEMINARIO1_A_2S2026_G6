-- Crea una tarea; la fecha de creacion se genera automaticamente.
CREATE OR REPLACE FUNCTION sp_crear_tarea(p_user_id INT, p_title VARCHAR, p_description TEXT)
RETURNS TABLE (id INT, title VARCHAR, description TEXT, completed BOOLEAN, created_at TEXT)
LANGUAGE sql AS $$
  INSERT INTO tasks AS t (user_id, title, description)
  VALUES (p_user_id, p_title, p_description)
  RETURNING t.id, t.title, t.description, t.completed,
            to_char(t.created_at, 'YYYY-MM-DD"T"HH24:MI:SS');
$$;
