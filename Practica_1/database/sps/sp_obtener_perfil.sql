DROP FUNCTION IF EXISTS "sp_obtener_perfil"(BIGINT) CASCADE;

CREATE OR REPLACE FUNCTION "sp_obtener_perfil"(p_id_usuario BIGINT)
RETURNS TABLE (
    id_usuario      BIGINT,
    nombre_completo VARCHAR,
    correo          VARCHAR,
    foto_perfil     VARCHAR,
    creado_en       TIMESTAMPTZ,
    actualizado_en  TIMESTAMPTZ,
    total_lista     BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id_usuario,
           u.nombre_completo,
           u.correo,
           u.foto_perfil,
           u.creado_en,
           u.actualizado_en,
           (SELECT COUNT(*) FROM lista_reproduccion l WHERE l.id_usuario = u.id_usuario)
    FROM usuario u
    WHERE u.id_usuario = p_id_usuario;
END;
$$ LANGUAGE plpgsql;
