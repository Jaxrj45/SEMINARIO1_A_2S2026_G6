DROP FUNCTION IF EXISTS "sp_login"(VARCHAR, TEXT) CASCADE;

-- Login. Devuelve 0 filas si las credenciales no coinciden.
CREATE OR REPLACE FUNCTION "sp_login"(
    p_correo   VARCHAR,
    p_password TEXT
)
RETURNS TABLE (
    id_usuario      BIGINT,
    nombre_completo VARCHAR,
    correo          VARCHAR,
    foto_perfil     VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id_usuario, u.nombre_completo, u.correo, u.foto_perfil
    FROM usuario u
    WHERE LOWER(u.correo) = LOWER(TRIM(p_correo))
      AND u.password = MD5(p_password);
END;
$$ LANGUAGE plpgsql;
