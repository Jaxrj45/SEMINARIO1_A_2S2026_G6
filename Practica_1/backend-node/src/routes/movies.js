const express = require('express');
const pool = require('../config/db');
const { serializeMovie } = require('../utils/serialize');

const router = express.Router();

// GET /movies - cartelera completa (disponibles y proximos estrenos)
router.get('/movies', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_pelicula, titulo, director, anio_estreno, url_contenido, poster, estado, se_puede_agregar
       FROM cloudcinema.v_cartelera
       ORDER BY anio_estreno DESC, titulo ASC`
    );
    return res.status(200).json({ movies: result.rows.map(serializeMovie) });
  } catch (err) {
    console.error('Error en /movies:', err);
    return res.status(500).json({ error: 'Error interno al obtener la cartelera' });
  }
});

module.exports = router;
