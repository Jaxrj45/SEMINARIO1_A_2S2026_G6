DROP FUNCTION IF EXISTS "sp_quitar_de_lista"(BIGINT, BIGINT) CASCADE;

CREATE OR REPLACE FUNCTION "sp_quitar_de_lista"(
    p_id_usuario  BIGINT,
    p_id_pelicula BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_borradas INTEGER;
BEGIN
    DELETE FROM lista_reproduccion l
    WHERE l.id_usuario = p_id_usuario
      AND l.id_pelicula = p_id_pelicula;
    GET DIAGNOSTICS v_borradas = ROW_COUNT;

    IF v_borradas = 0 THEN
        RAISE EXCEPTION 'La pelicula % no esta en la lista del usuario %.', p_id_pelicula, p_id_usuario
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
