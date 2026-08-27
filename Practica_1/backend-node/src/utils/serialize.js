// Convierte filas de la BD (que solo guardan la ruta relativa en S3)
// a objetos de respuesta con la URL publica lista para el frontend.
const { publicUrl } = require('../config/s3');

function serializeUser(row) {
  return {
    id_usuario: row.id_usuario,
    nombre_completo: row.nombre_completo,
    correo: row.correo,
    foto_perfil: publicUrl(row.foto_perfil),
  };
}

function serializeMovie(row) {
  return {
    id_pelicula: row.id_pelicula,
    titulo: row.titulo,
    director: row.director,
    anio_estreno: row.anio_estreno,
    url_contenido: row.url_contenido,
    poster: publicUrl(row.poster),
    estado: row.estado,
    se_puede_agregar: row.se_puede_agregar,
  };
}

function serializePlaylistItem(row) {
  return {
    id_lista: row.id_lista,
    id_usuario: row.id_usuario,
    id_pelicula: row.id_pelicula,
    titulo: row.titulo,
    director: row.director,
    anio_estreno: row.anio_estreno,
    url_contenido: row.url_contenido,
    poster: publicUrl(row.poster),
    agregada_en: row.agregada_en,
  };
}

module.exports = { serializeUser, serializeMovie, serializePlaylistItem };
