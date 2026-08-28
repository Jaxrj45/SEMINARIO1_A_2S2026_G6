DROP FUNCTION IF EXISTS "sp_eliminar_pelicula"(BIGINT) CASCADE;

-- Al borrar la pelicula, el ON DELETE CASCADE la saca
-- automaticamente de la lista de todos los usuarios.
CREATE OR REPLACE FUNCTION "sp_eliminar_pelicula"(p_id_pelicula BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    v_borradas INTEGER;
BEGIN
    DELETE FROM pelicula p WHERE p.id_pelicula = p_id_pelicula;
    GET DIAGNOSTICS v_borradas = ROW_COUNT;

    IF v_borradas = 0 THEN
        RAISE EXCEPTION 'La pelicula % no existe.', p_id_pelicula
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
