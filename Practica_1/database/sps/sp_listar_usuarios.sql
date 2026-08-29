DROP FUNCTION IF EXISTS "sp_listar_usuarios"() CASCADE;

CREATE OR REPLACE FUNCTION "sp_listar_usuarios"()
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
    ORDER BY u.id_usuario;
END;
$$ LANGUAGE plpgsql;
