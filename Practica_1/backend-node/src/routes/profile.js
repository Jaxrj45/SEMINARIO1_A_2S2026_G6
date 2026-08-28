const express = require('express');
const crypto = require('crypto');
const path = require('path');
const pool = require('../config/db');
const upload = require('../middleware/upload');
const { uploadToS3 } = require('../config/s3');
const { serializeUser } = require('../utils/serialize');

const router = express.Router();

// PUT /profile
// multipart/form-data: id_usuario, password (obligatorios), nombre_completo y/o foto_perfil (opcionales)
// foto_perfil puede ser un archivo (se sube a S3) o, en JSON, la key ya subida (ej. "Fotos_Perfil/x.jpg").
router.put('/profile', upload.single('foto_perfil'), async (req, res) => {
  const { id_usuario, password, nombre_completo } = req.body;
  const foto_perfil = req.body.foto_perfil;

  if (!id_usuario || !password) {
    return res.status(400).json({ error: 'id_usuario y password son obligatorios' });
  }
  if (!nombre_completo && !foto_perfil && !req.file) {
    return res
      .status(400)
      .json({ error: 'Debes enviar al menos nombre_completo o foto_perfil' });
  }

  try {
    let fotoPerfilKey = foto_perfil || null;
    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const key = `${process.env.S3_FOLDER_PROFILE}/${crypto.randomUUID()}${ext}`;
      fotoPerfilKey = await uploadToS3(req.file.buffer, key, req.file.mimetype);
    }

    const result = await pool.query('SELECT * FROM sp_actualizar_perfil($1, $2, $3, $4)', [
      id_usuario,
      nombre_completo || null,
      fotoPerfilKey,
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
