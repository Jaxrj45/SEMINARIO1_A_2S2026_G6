const express = require('express');
const path = require('path');
const crypto = require('crypto');
const pool = require('../config/db');
const upload = require('../middleware/upload');
const { uploadToS3 } = require('../config/s3');
const { md5 } = require('../utils/crypto');
const { isValidEmail } = require('../utils/validate');
const { serializeUser } = require('../utils/serialize');

const router = express.Router();

// POST /register
// multipart/form-data: correo, nombre, password, password_confirm, foto (opcional)
router.post('/register', upload.single('foto'), async (req, res) => {
  const { correo, nombre, password, password_confirm } = req.body;

  if (!correo || !nombre || !password || !password_confirm) {
    return res
      .status(400)
      .json({ error: 'correo, nombre, password y password_confirm son obligatorios' });
  }
  if (!isValidEmail(correo)) {
    return res.status(400).json({ error: 'Formato de correo invalido' });
  }
  if (password !== password_confirm) {
    return res.status(400).json({ error: 'password y password_confirm no coinciden' });
  }

  try {
    const existing = await pool.query(
      'SELECT id_usuario FROM cloudcinema.usuario WHERE LOWER(correo) = LOWER($1)',
      [correo]
    );
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }

    let fotoKey = null;
    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      fotoKey = `Fotos_Perfil/${crypto.randomUUID()}${ext}`;
      await uploadToS3(req.file.buffer, fotoKey, req.file.mimetype);
    }

    const result = await pool.query(
      `INSERT INTO cloudcinema.usuario (nombre_completo, correo, password_md5, foto_perfil)
       VALUES ($1, $2, $3, $4)
       RETURNING id_usuario, nombre_completo, correo, foto_perfil`,
      [nombre, correo, md5(password), fotoKey]
    );

    return res.status(201).json({ user: serializeUser(result.rows[0]) });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo' });
    }
    console.error('Error en /register:', err);
    return res.status(500).json({ error: 'Error interno al registrar el usuario' });
  }
});

// POST /login
// JSON: { correo, password }
router.post('/login', async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: 'correo y password son obligatorios' });
  }
  if (!isValidEmail(correo)) {
    return res.status(400).json({ error: 'Formato de correo invalido' });
  }

  try {
    const result = await pool.query(
      `SELECT id_usuario, nombre_completo, correo, foto_perfil, password_md5
       FROM cloudcinema.usuario WHERE LOWER(correo) = LOWER($1)`,
      [correo]
    );

    const row = result.rows[0];
    if (!row || row.password_md5 !== md5(password)) {
      return res.status(401).json({ error: 'Correo o contrasena incorrectos' });
    }

    return res.status(200).json({ user: serializeUser(row) });
  } catch (err) {
    console.error('Error en /login:', err);
    return res.status(500).json({ error: 'Error interno al iniciar sesion' });
  }
});

module.exports = router;
