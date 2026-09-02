const express = require('express');
const pool = require('../config/db');
const { serializePlaylistItem } = require('../utils/serialize');
const { handleDbError } = require('../utils/dbErrors');
const { getPayload } = require('../utils/body');

const router = express.Router();

router.post('/playlist', async (req, res) => {
  const data = getPayload(req);
  if (!data) {
    return res.status(400).json({ error: 'Cuerpo JSON requerido' });
  }

  const { id_usuario, id_pelicula } = data;

  if (!id_usuario || !id_pelicula) {
    return res.status(400).json({ error: 'id_usuario e id_pelicula son obligatorios' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM sp_agregar_a_lista($1::bigint, $2::bigint)',
      [id_usuario, id_pelicula]
    );
    const resultado = result.rows[0];

    if (resultado.ya_estaba) {
      return res
        .status(200)
        .json({ ...resultado, mensaje: 'Esta pelicula ya estaba en tu lista' });
    }

    return res
      .status(201)
      .json({ ...resultado, mensaje: 'Pelicula anadida a tu lista de reproduccion' });
  } catch (err) {
    return handleDbError(
      err,
      res,
      {
        P0002: 'El usuario o la pelicula no existen',
        23514: 'La pelicula es un proximo estreno y no puede agregarse a la lista',
      },
      'POST /playlist'
    );
  }
});

router.get('/playlist', async (req, res) => {
  const { id_usuario } = req.query;

  if (!id_usuario) {
    return res.status(400).json({ error: 'id_usuario es obligatorio (query param)' });
  }

  try {
    const result = await pool.query('SELECT * FROM sp_listar_mi_lista($1::bigint)', [id_usuario]);
    return res.status(200).json(result.rows.map(serializePlaylistItem));
  } catch (err) {
    return handleDbError(err, res, {}, 'GET /playlist');
  }
});

router.delete('/playlist/:id_lista', async (req, res) => {
  const { id_usuario } = req.query;

  if (!id_usuario) {
    return res.status(400).json({ error: 'id_usuario es obligatorio (query param)' });
  }

  try {
    const entrada = await pool.query(
      'SELECT id_pelicula FROM lista_reproduccion WHERE id_lista = $1::bigint AND id_usuario = $2::bigint',
      [req.params.id_lista, id_usuario]
    );

    if (entrada.rowCount === 0) {
      return res.status(404).json({ error: 'No se encontro esa entrada en tu lista' });
    }

    await pool.query('SELECT sp_quitar_de_lista($1::bigint, $2::bigint)', [
      id_usuario,
      entrada.rows[0].id_pelicula,
    ]);
    return res.status(200).json({ mensaje: 'Pelicula eliminada de tu lista' });
  } catch (err) {
    return handleDbError(
      err,
      res,
      { P0002: 'No se encontro esa entrada en tu lista' },
      'DELETE /playlist/:id_lista'
    );
  }
});

module.exports = router;
