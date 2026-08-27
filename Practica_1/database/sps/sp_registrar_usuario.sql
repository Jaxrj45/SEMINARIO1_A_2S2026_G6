DROP FUNCTION IF EXISTS "sp_registrar_usuario"(VARCHAR, VARCHAR, TEXT, VARCHAR) CASCADE;

-- Registro. Falla si el correo ya existe (sin importar mayusculas).
CREATE OR REPLACE FUNCTION "sp_registrar_usuario"(
    p_nombre_completo VARCHAR,
    p_correo          VARCHAR,
    p_password        TEXT,
    p_foto_perfil     VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id_usuario      BIGINT,
    nombre_completo VARCHAR,
    correo          VARCHAR,
    foto_perfil     VARCHAR,
    creado_en       TIMESTAMPTZ
) AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM usuario u WHERE LOWER(u.correo) = LOWER(TRIM(p_correo))) THEN
        RAISE EXCEPTION 'El correo % ya esta registrado.', p_correo
            USING ERRCODE = 'unique_violation';
    END IF;

    RETURN QUERY
    INSERT INTO usuario (nombre_completo, correo, password, foto_perfil)
    VALUES (TRIM(p_nombre_completo), LOWER(TRIM(p_correo)), MD5(p_password), p_foto_perfil)
    RETURNING usuario.id_usuario,
              usuario.nombre_completo,
              usuario.correo,
              usuario.foto_perfil,
              usuario.creado_en;
END;
$$ LANGUAGE plpgsql;
