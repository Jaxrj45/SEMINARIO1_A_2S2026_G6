const express = require('express');
const path = require('path');
const crypto = require('crypto');
const pool = require('../config/db');
const upload = require('../middleware/upload');
const { uploadToS3 } = require('../config/s3');
const { md5 } = require('../utils/crypto');
const { serializeUser } = require('../utils/serialize');

const router = express.Router();

// PUT /profile
// multipart/form-data: id_usuario, password_actual (obligatorios),
// nombre_completo (opcional), foto (opcional)
router.put('/profile', upload.single('foto'), async (req, res) => {
  const { id_usuario, password_actual, nombre_completo } = req.body;

  if (!id_usuario || !password_actual) {
    return res.status(400).json({ error: 'id_usuario y password_actual son obligatorios' });
  }

  try {
    const current = await pool.query(
      'SELECT id_usuario, password_md5 FROM cloudcinema.usuario WHERE id_usuario = $1',
      [id_usuario]
    );
    const row = current.rows[0];
    if (!row || row.password_md5 !== md5(password_actual)) {
      return res.status(401).json({ error: 'Contrasena actual incorrecta' });
    }

    let fotoKey = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      fotoKey = `Fotos_Perfil/${crypto.randomUUID()}${ext}`;
      await uploadToS3(req.file.buffer, fotoKey, req.file.mimetype);
    }

    const result = await pool.query(
      `UPDATE cloudcinema.usuario
       SET nombre_completo = COALESCE($1, nombre_completo),
           foto_perfil = COALESCE($2, foto_perfil)
       WHERE id_usuario = $3
       RETURNING id_usuario, nombre_completo, correo, foto_perfil`,
      [nombre_completo || null, fotoKey, id_usuario]
    );

    return res.status(200).json({ user: serializeUser(result.rows[0]) });
  } catch (err) {
    console.error('Error en /profile:', err);
    return res.status(500).json({ error: 'Error interno al actualizar el perfil' });
  }
});

module.exports = router;
