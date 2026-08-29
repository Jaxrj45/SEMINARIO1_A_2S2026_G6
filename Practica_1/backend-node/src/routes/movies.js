const express = require('express');
const pool = require('../config/db');
const { serializeMovie } = require('../utils/serialize');
const { handleDbError } = require('../utils/dbErrors');
const { getPayload, trimOrNull } = require('../utils/body');

const router = express.Router();

const ESTADOS_VALIDOS = ['DISPONIBLE', 'PROXIMO_ESTRENO'];

router.get('/movies', async (req, res) => {
  const id_usuario = trimOrNull(req.query.id_usuario);

  try {
    const result = await pool.query('SELECT * FROM sp_listar_peliculas($1::bigint)', [id_usuario]);
    return res.status(200).json(result.rows.map(serializeMovie));
  } catch (err) {
    return handleDbError(err, res, {}, 'GET /movies');
  }
});

router.get('/movies/:id_pelicula', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sp_obtener_pelicula($1::bigint)', [
      req.params.id_pelicula,
    ]);
    const pelicula = result.rows[0];

    if (!pelicula) {
      return res.status(404).json({ error: 'Pelicula no encontrada' });
    }
    return res.status(200).json(serializeMovie(pelicula));
  } catch (err) {
    return handleDbError(err, res, {}, 'GET /movies/:id_pelicula');
  }
});

router.post('/movies', async (req, res) => {
  const data = getPayload(req);
  if (!data) {
    return res.status(400).json({ error: 'Cuerpo JSON requerido' });
  }

  const titulo = trimOrNull(data.titulo);
  const director = trimOrNull(data.director);
  const anio_estreno = data.anio_estreno;
  const url_contenido = trimOrNull(data.url_contenido);
  const poster = trimOrNull(data.poster);
  const estado = data.estado || 'DISPONIBLE';

  if (!titulo || !director || !anio_estreno || !url_contenido || !poster) {
    return res.status(400).json({
      error: 'titulo, director, anio_estreno, url_contenido y poster son obligatorios',
    });
  }
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res
      .status(400)
      .json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM sp_crear_pelicula($1, $2, $3::smallint, $4, $5, $6)',
      [titulo, director, anio_estreno, url_contenido, poster, estado]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return handleDbError(
      err,
      res,
      { 23505: 'Ya existe una pelicula con ese titulo, director y anio' },
      'POST /movies'
    );
  }
});

router.put('/movies/:id_pelicula', async (req, res) => {
  const data = getPayload(req);
  if (!data) {
    return res.status(400).json({ error: 'Cuerpo JSON requerido' });
  }

  const estado = data.estado || null;
  if (estado && !ESTADOS_VALIDOS.includes(estado)) {
    return res
      .status(400)
      .json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM sp_actualizar_pelicula($1::bigint, $2, $3, $4::smallint, $5, $6, $7)',
      [
        req.params.id_pelicula,
        trimOrNull(data.titulo),
        trimOrNull(data.director),
        data.anio_estreno === undefined ? null : data.anio_estreno,
        trimOrNull(data.url_contenido),
        trimOrNull(data.poster),
        estado,
      ]
    );
    return res.status(200).json(serializeMovie(result.rows[0]));
  } catch (err) {
    return handleDbError(
      err,
      res,
      { P0002: 'Pelicula no encontrada' },
      'PUT /movies/:id_pelicula'
    );
  }
});

router.delete('/movies/:id_pelicula', async (req, res) => {
  try {
    await pool.query('SELECT sp_eliminar_pelicula($1::bigint)', [req.params.id_pelicula]);
    return res.status(200).json({ mensaje: 'Pelicula eliminada' });
  } catch (err) {
    return handleDbError(
      err,
      res,
      { P0002: 'Pelicula no encontrada' },
      'DELETE /movies/:id_pelicula'
    );
  }
});

module.exports = router;
