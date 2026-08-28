DROP FUNCTION IF EXISTS "sp_recuperar_password"(VARCHAR, TEXT) CASCADE;

-- Recuperar contrasena: reset directo por correo.
-- OJO: no hay token ni verificacion de identidad. Cualquiera que
-- conozca un correo registrado puede cambiar esa contrasena.
CREATE OR REPLACE FUNCTION "sp_recuperar_password"(
    p_correo         VARCHAR,
    p_nueva_password TEXT
)
RETURNS TABLE (
    id_usuario BIGINT,
    correo     VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    UPDATE usuario u
    SET password = MD5(p_nueva_password)
    WHERE LOWER(u.correo) = LOWER(TRIM(p_correo))
    RETURNING u.id_usuario, u.correo;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe una cuenta con el correo %.', p_correo
            USING ERRCODE = 'no_data_found';
    END IF;
END;
$$ LANGUAGE plpgsql;
