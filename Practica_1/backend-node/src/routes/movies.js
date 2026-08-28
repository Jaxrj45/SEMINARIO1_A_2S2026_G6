const express = require('express');
const pool = require('../config/db');
const { serializeMovie } = require('../utils/serialize');

const router = express.Router();

// GET /movies - cartelera completa (disponibles y proximos estrenos)
router.get('/movies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sp_listar_peliculas()');
    return res.status(200).json(result.rows.map(serializeMovie));
  } catch (err) {
    console.error('Error en /movies:', err);
    return res.status(500).json({ error: 'Error interno al obtener la cartelera' });
  }
});

module.exports = router;
