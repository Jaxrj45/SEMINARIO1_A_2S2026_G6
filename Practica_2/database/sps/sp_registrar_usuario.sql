-- Registra un usuario. La contrasena llega en texto y se guarda con bcrypt (pgcrypto).
-- Si el username ya existe lanza unique_violation (23505) -> el backend responde 409.
DROP FUNCTION IF EXISTS sp_registrar_usuario(VARCHAR, VARCHAR, VARCHAR, VARCHAR);
CREATE FUNCTION sp_registrar_usuario(
  p_username          VARCHAR,
  p_email             VARCHAR,
  p_password          VARCHAR,
  p_profile_image_url VARCHAR
)
RETURNS TABLE (id INT, username VARCHAR, email VARCHAR, profile_image_url VARCHAR)
LANGUAGE sql AS $$
  INSERT INTO users AS u (username, email, password_hash, profile_image_url)
  VALUES (p_username, p_email, crypt(p_password, gen_salt('bf', 10)), p_profile_image_url)
  RETURNING u.id, u.username, u.email, u.profile_image_url;
$$;
