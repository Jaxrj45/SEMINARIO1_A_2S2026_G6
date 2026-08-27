DROP FUNCTION IF EXISTS "sp_agregar_a_lista"(BIGINT, BIGINT) CASCADE;

-- Solo se pueden agregar peliculas DISPONIBLES.
-- Si ya estaba en la lista, no la duplica ni truena.
CREATE OR REPLACE FUNCTION "sp_agregar_a_lista"(
    p_id_usuario  BIGINT,
    p_id_pelicula BIGINT
)
RETURNS TABLE (
    id_lista    BIGINT,
    id_pelicula BIGINT,
    titulo      VARCHAR,
    agregada_en TIMESTAMPTZ,
    ya_estaba   BOOLEAN
) AS $$
DECLARE
    v_estado    estado_pelicula;
    v_id_lista  BIGINT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuario u WHERE u.id_usuario = p_id_usuario) THEN
        RAISE EXCEPTION 'El usuario % no existe.', p_id_usuario
            USING ERRCODE = 'no_data_found';
    END IF;

    SELECT p.estado INTO v_estado FROM pelicula p WHERE p.id_pelicula = p_id_pelicula;

    IF v_estado IS NULL THEN
        RAISE EXCEPTION 'La pelicula % no existe.', p_id_pelicula
            USING ERRCODE = 'no_data_found';
    END IF;

    IF v_estado <> 'DISPONIBLE' THEN
        RAISE EXCEPTION 'La pelicula % es un proximo estreno y no puede agregarse a la lista.', p_id_pelicula
            USING ERRCODE = 'check_violation';
    END IF;

    SELECT l.id_lista INTO v_id_lista
    FROM lista_reproduccion l
    WHERE l.id_usuario = p_id_usuario AND l.id_pelicula = p_id_pelicula;

    IF v_id_lista IS NOT NULL THEN
        RETURN QUERY
        SELECT l.id_lista, p.id_pelicula, p.titulo, l.agregada_en, TRUE
        FROM lista_reproduccion l
        JOIN pelicula p ON p.id_pelicula = l.id_pelicula
        WHERE l.id_lista = v_id_lista;
        RETURN;
    END IF;

    RETURN QUERY
    WITH nueva AS (
        INSERT INTO lista_reproduccion (id_usuario, id_pelicula)
        VALUES (p_id_usuario, p_id_pelicula)
        RETURNING lista_reproduccion.id_lista,
                  lista_reproduccion.id_pelicula,
                  lista_reproduccion.agregada_en
    )
    SELECT n.id_lista, n.id_pelicula, p.titulo, n.agregada_en, FALSE
    FROM nueva n
    JOIN pelicula p ON p.id_pelicula = n.id_pelicula;
END;
$$ LANGUAGE plpgsql;
