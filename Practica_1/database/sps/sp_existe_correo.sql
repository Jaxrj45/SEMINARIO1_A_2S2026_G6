DROP FUNCTION IF EXISTS "sp_existe_correo"(VARCHAR) CASCADE;

-- Para validar el formulario de registro antes de enviarlo.
CREATE OR REPLACE FUNCTION "sp_existe_correo"(p_correo VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM usuario u WHERE LOWER(u.correo) = LOWER(TRIM(p_correo))
    );
END;
$$ LANGUAGE plpgsql;
