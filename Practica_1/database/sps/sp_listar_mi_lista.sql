DROP FUNCTION IF EXISTS "sp_listar_mi_lista"(BIGINT) CASCADE;

-- Las agregadas mas recientemente van primero (lo pide el enunciado).
CREATE OR REPLACE FUNCTION "sp_listar_mi_lista"(p_id_usuario BIGINT)
RETURNS TABLE (
    id_lista      BIGINT,
    id_pelicula   BIGINT,
    titulo        VARCHAR,
    director      VARCHAR,
    anio_estreno  SMALLINT,
    url_contenido VARCHAR,
    poster        VARCHAR,
    agregada_en   TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT l.id_lista,
           p.id_pelicula,
           p.titulo,
           p.director,
           p.anio_estreno,
           p.url_contenido,
           p.poster,
           l.agregada_en
    FROM lista_reproduccion l
    JOIN pelicula p ON p.id_pelicula = l.id_pelicula
    WHERE l.id_usuario = p_id_usuario
    ORDER BY l.agregada_en DESC;
END;
$$ LANGUAGE plpgsql;
