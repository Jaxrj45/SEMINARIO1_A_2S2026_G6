const express = require('express');
const pool = require('../config/db');
const { serializePlaylistItem } = require('../utils/serialize');

const router = express.Router();

// POST /playlist - JSON: { id_usuario, id_pelicula }
router.post('/playlist', async (req, res) => {
  const { id_usuario, id_pelicula } = req.body;

  if (!id_usuario || !id_pelicula) {
    return res.status(400).json({ error: 'id_usuario e id_pelicula son obligatorios' });
  }

  try {
    const insert = await pool.query(
      `INSERT INTO cloudcinema.lista_reproduccion (id_usuario, id_pelicula)
       VALUES ($1, $2)
       RETURNING id_lista`,
      [id_usuario, id_pelicula]
    );

    const item = await pool.query('SELECT * FROM cloudcinema.v_mi_lista WHERE id_lista = $1', [
      insert.rows[0].id_lista,
    ]);

    return res.status(201).json({ item: serializePlaylistItem(item.rows[0]) });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'La pelicula ya esta en tu lista' });
    }
    if (err.code === '23503') {
      return res.status(404).json({ error: 'Usuario o pelicula no existe' });
    }
    // trigger tg_lista_solo_disponibles (fn_lista_solo_disponibles) usa ERRCODE check_violation (23514)
    if (err.code === '23514') {
      return res
        .status(400)
        .json({ error: 'Esa pelicula es un proximo estreno y no se puede agregar a la lista' });
    }
    console.error('Error en POST /playlist:', err);
    return res.status(500).json({ error: 'Error interno al agregar a la lista' });
  }
});

// GET /playlist?id_usuario=... - lista del usuario, mas reciente primero
router.get('/playlist', async (req, res) => {
  const { id_usuario } = req.query;

  if (!id_usuario) {
    return res.status(400).json({ error: 'id_usuario es obligatorio' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM cloudcinema.v_mi_lista WHERE id_usuario = $1 ORDER BY agregada_en DESC',
      [id_usuario]
    );
    return res.status(200).json({ playlist: result.rows.map(serializePlaylistItem) });
  } catch (err) {
    console.error('Error en GET /playlist:', err);
    return res.status(500).json({ error: 'Error interno al obtener la lista' });
  }
});

// DELETE /playlist/:id?id_usuario=... - :id es el id_lista (fila de lista_reproduccion)
router.delete('/playlist/:id', async (req, res) => {
  const { id } = req.params;
  const { id_usuario } = req.query;

  if (!id_usuario) {
    return res.status(400).json({ error: 'id_usuario es obligatorio' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM cloudcinema.lista_reproduccion WHERE id_lista = $1 AND id_usuario = $2 RETURNING id_lista',
      [id, id_usuario]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Elemento no encontrado en tu lista' });
    }
    return res.status(200).json({ deleted: true });
  } catch (err) {
    console.error('Error en DELETE /playlist/:id:', err);
    return res.status(500).json({ error: 'Error interno al eliminar de la lista' });
  }
});

module.exports = router;
