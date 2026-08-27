DROP FUNCTION IF EXISTS "sp_listar_peliculas"(BIGINT) CASCADE;

-- Cartelera. Si se manda un id de usuario, cada pelicula indica
-- ademas si ese usuario ya la tiene en su lista.
CREATE OR REPLACE FUNCTION "sp_listar_peliculas"(p_id_usuario BIGINT DEFAULT NULL)
RETURNS TABLE (
    id_pelicula      BIGINT,
    titulo           VARCHAR,
    director         VARCHAR,
    anio_estreno     SMALLINT,
    url_contenido    VARCHAR,
    poster           VARCHAR,
    estado           estado_pelicula,
    se_puede_agregar BOOLEAN,
    en_mi_lista      BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id_pelicula,
           p.titulo,
           p.director,
           p.anio_estreno,
           p.url_contenido,
           p.poster,
           p.estado,
           (p.estado = 'DISPONIBLE'),
           (p_id_usuario IS NOT NULL AND EXISTS (
                SELECT 1 FROM lista_reproduccion l
                WHERE l.id_pelicula = p.id_pelicula
                  AND l.id_usuario  = p_id_usuario
           ))
    FROM pelicula p
    ORDER BY p.titulo;
END;
$$ LANGUAGE plpgsql;
