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
    const result = await pool.query('SELECT * FROM sp_agregar_a_lista($1, $2)', [
      id_usuario,
      id_pelicula,
    ]);
    const row = result.rows[0];

    if (row.ya_estaba) {
      return res.status(409).json({ error: 'Esta pelicula ya esta en tu lista' });
    }

    return res.status(201).json({
      id_lista: row.id_lista,
      id_usuario: Number(id_usuario),
      id_pelicula: row.id_pelicula,
      agregada_en: row.agregada_en,
      mensaje: 'Pelicula anadida a tu lista de reproduccion',
    });
  } catch (err) {
    // sp_agregar_a_lista usa ERRCODE no_data_found (P0002) y check_violation (23514)
    if (err.code === 'P0002') {
      return res.status(404).json({ error: 'El usuario o la pelicula no existen' });
    }
    if (err.code === '23514') {
      return res.status(400).json({ error: err.message });
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
    const result = await pool.query('SELECT * FROM sp_listar_mi_lista($1)', [id_usuario]);
    return res.status(200).json(result.rows.map(serializePlaylistItem));
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
      'DELETE FROM lista_reproduccion WHERE id_lista = $1 AND id_usuario = $2 RETURNING id_lista',
      [id, id_usuario]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No se encontro esa entrada en tu lista' });
    }
    return res.status(200).json({ mensaje: 'Pelicula eliminada de tu lista' });
  } catch (err) {
    console.error('Error en DELETE /playlist/:id:', err);
    return res.status(500).json({ error: 'Error interno al eliminar de la lista' });
  }
});

module.exports = router;
