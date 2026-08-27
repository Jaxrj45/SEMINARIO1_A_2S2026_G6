DROP FUNCTION IF EXISTS "sp_actualizar_perfil"(BIGINT, VARCHAR, VARCHAR, TEXT) CASCADE;

-- Editar perfil. El enunciado exige la contrasena ACTUAL para guardar.
-- Los parametros en NULL dejan el valor que ya tenia.
CREATE OR REPLACE FUNCTION "sp_actualizar_perfil"(
    p_id_usuario       BIGINT,
    p_nombre_completo  VARCHAR,
    p_foto_perfil      VARCHAR,
    p_password_actual  TEXT
)
RETURNS TABLE (
    id_usuario      BIGINT,
    nombre_completo VARCHAR,
    correo          VARCHAR,
    foto_perfil     VARCHAR,
    actualizado_en  TIMESTAMPTZ
) AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuario u WHERE u.id_usuario = p_id_usuario) THEN
        RAISE EXCEPTION 'El usuario % no existe.', p_id_usuario
            USING ERRCODE = 'no_data_found';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM usuario u
        WHERE u.id_usuario = p_id_usuario
          AND u.password = MD5(p_password_actual)
    ) THEN
        RAISE EXCEPTION 'La contrasena actual es incorrecta.'
            USING ERRCODE = 'invalid_password';
    END IF;

    RETURN QUERY
    UPDATE usuario u
    SET nombre_completo = COALESCE(NULLIF(TRIM(p_nombre_completo), ''), u.nombre_completo),
        foto_perfil     = COALESCE(p_foto_perfil, u.foto_perfil)
    WHERE u.id_usuario = p_id_usuario
    RETURNING u.id_usuario, u.nombre_completo, u.correo, u.foto_perfil, u.actualizado_en;
END;
$$ LANGUAGE plpgsql;
