DROP FUNCTION IF EXISTS "sp_crear_pelicula"(VARCHAR, VARCHAR, SMALLINT, VARCHAR, VARCHAR, estado_pelicula) CASCADE;

CREATE OR REPLACE FUNCTION "sp_crear_pelicula"(
    p_titulo        VARCHAR,
    p_director      VARCHAR,
    p_anio_estreno  SMALLINT,
    p_url_contenido VARCHAR,
    p_poster        VARCHAR,
    p_estado        estado_pelicula DEFAULT 'DISPONIBLE'
)
RETURNS TABLE (
    id_pelicula BIGINT,
    titulo      VARCHAR,
    estado      estado_pelicula
) AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pelicula p
        WHERE p.titulo = TRIM(p_titulo)
          AND p.director = TRIM(p_director)
          AND p.anio_estreno = p_anio_estreno
    ) THEN
        RAISE EXCEPTION 'La pelicula "%" de % (%) ya existe en el catalogo.',
            p_titulo, p_director, p_anio_estreno
            USING ERRCODE = 'unique_violation';
    END IF;

    RETURN QUERY
    INSERT INTO pelicula (titulo, director, anio_estreno, url_contenido, poster, estado)
    VALUES (TRIM(p_titulo), TRIM(p_director), p_anio_estreno, p_url_contenido, p_poster, p_estado)
    RETURNING pelicula.id_pelicula, pelicula.titulo, pelicula.estado;
END;
$$ LANGUAGE plpgsql;
