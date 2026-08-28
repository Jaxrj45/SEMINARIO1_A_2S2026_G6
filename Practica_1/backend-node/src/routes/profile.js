const express = require('express');
const pool = require('../config/db');
const { serializeUser } = require('../utils/serialize');

const router = express.Router();

// PUT /profile
// JSON: id_usuario, password (obligatorios), nombre_completo y/o foto_perfil (opcionales)
// foto_perfil es la key relativa en S3 (ej. "Fotos_Perfil/x.jpg"), no un archivo.
router.put('/profile', async (req, res) => {
  const { id_usuario, password, nombre_completo, foto_perfil } = req.body;

  if (!id_usuario || !password) {
    return res.status(400).json({ error: 'id_usuario y password son obligatorios' });
  }
  if (!nombre_completo && !foto_perfil) {
    return res
      .status(400)
      .json({ error: 'Debes enviar al menos nombre_completo o foto_perfil' });
  }

  try {
    const result = await pool.query('SELECT * FROM sp_actualizar_perfil($1, $2, $3, $4)', [
      id_usuario,
      nombre_completo || null,
      foto_perfil || null,
      password,
    ]);
    return res.status(200).json(serializeUser(result.rows[0]));
  } catch (err) {
    // sp_actualizar_perfil usa ERRCODE no_data_found (P0002) e invalid_password (28P01)
    if (err.code === 'P0002') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (err.code === '28P01') {
      return res.status(401).json({ error: 'Contrasena actual incorrecta' });
    }
    console.error('Error en /profile:', err);
    return res.status(500).json({ error: 'Error interno al actualizar el perfil' });
  }
});

module.exports = router;
