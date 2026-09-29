-- Devuelve el usuario solo si la contrasena coincide con el hash; si no, cero filas (-> 401).
DROP FUNCTION IF EXISTS sp_login(VARCHAR, VARCHAR);
CREATE FUNCTION sp_login(p_username VARCHAR, p_password VARCHAR)
RETURNS TABLE (id INT, username VARCHAR, email VARCHAR, profile_image_url VARCHAR)
LANGUAGE sql AS $$
  SELECT u.id, u.username, u.email, u.profile_image_url
  FROM users u
  WHERE u.username = p_username
    AND u.password_hash = crypt(p_password, u.password_hash);
$$;
