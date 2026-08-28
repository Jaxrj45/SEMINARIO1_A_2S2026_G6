DROP FUNCTION IF EXISTS "sp_actualizar_pelicula"(BIGINT, VARCHAR, VARCHAR, SMALLINT, VARCHAR, VARCHAR, estado_pelicula) CASCADE;

-- Los parametros en NULL dejan el valor que ya tenia.
CREATE OR REPLACE FUNCTION "sp_actualizar_pelicula"(
    p_id_pelicula   BIGINT,
    p_titulo        VARCHAR DEFAULT NULL,
    p_director      VARCHAR DEFAULT NULL,
    p_anio_estreno  SMALLINT DEFAULT NULL,
    p_url_contenido VARCHAR DEFAULT NULL,
    p_poster        VARCHAR DEFAULT NULL,
    p_estado        estado_pelicula DEFAULT NULL
)
RETURNS TABLE (
    id_pelicula   BIGINT,
    titulo        VARCHAR,
    director      VARCHAR,
    anio_estreno  SMALLINT,
    url_contenido VARCHAR,
    poster        VARCHAR,
    estado        estado_pelicula
) AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pelicula p WHERE p.id_pelicula = p_id_pelicula) THEN
        RAISE EXCEPTION 'La pelicula % no existe.', p_id_pelicula
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN QUERY
    UPDATE pelicula p
    SET titulo        = COALESCE(NULLIF(TRIM(p_titulo), ''), p.titulo),
        director      = COALESCE(NULLIF(TRIM(p_director), ''), p.director),
        anio_estreno  = COALESCE(p_anio_estreno, p.anio_estreno),
        url_contenido = COALESCE(NULLIF(TRIM(p_url_contenido), ''), p.url_contenido),
        poster        = COALESCE(NULLIF(TRIM(p_poster), ''), p.poster),
        estado        = COALESCE(p_estado, p.estado)
    WHERE p.id_pelicula = p_id_pelicula
    RETURNING p.id_pelicula, p.titulo, p.director, p.anio_estreno,
              p.url_contenido, p.poster, p.estado;
END;
$$ LANGUAGE plpgsql;
