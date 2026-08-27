DROP FUNCTION IF EXISTS "sp_obtener_pelicula"(BIGINT) CASCADE;

CREATE OR REPLACE FUNCTION "sp_obtener_pelicula"(p_id_pelicula BIGINT)
RETURNS TABLE (
    id_pelicula   BIGINT,
    titulo        VARCHAR,
    director      VARCHAR,
    anio_estreno  SMALLINT,
    url_contenido VARCHAR,
    poster        VARCHAR,
    estado        estado_pelicula,
    creado_en     TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id_pelicula, p.titulo, p.director, p.anio_estreno,
           p.url_contenido, p.poster, p.estado, p.creado_en
    FROM pelicula p
    WHERE p.id_pelicula = p_id_pelicula;
END;
$$ LANGUAGE plpgsql;
