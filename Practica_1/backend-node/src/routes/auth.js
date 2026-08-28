const express = require('express');
const pool = require('../config/db');
const { isValidEmail } = require('../utils/validate');
const { serializeUser } = require('../utils/serialize');

const router = express.Router();

// POST /auth/register
// JSON: { correo, nombre_completo, password, password_confirm, foto_perfil? }
// foto_perfil es la key relativa en S3 (ej. "Fotos_Perfil/x.jpg"), no un archivo.
router.post('/auth/register', async (req, res) => {
  const { correo, nombre_completo, password, password_confirm, foto_perfil } = req.body;

  if (!correo || !nombre_completo || !password || !password_confirm) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (!isValidEmail(correo)) {
    return res.status(400).json({ error: 'Formato de correo invalido' });
  }
  if (password !== password_confirm) {
    return res.status(400).json({ error: 'Las contrasenas no coinciden' });
  }

  try {
    const result = await pool.query('SELECT * FROM sp_registrar_usuario($1, $2, $3, $4)', [
      nombre_completo,
      correo,
      password,
      foto_perfil || null,
    ]);
    return res.status(201).json(serializeUser(result.rows[0]));
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El correo ya esta registrado' });
    }
    console.error('Error en /auth/register:', err);
    return res.status(500).json({ error: 'Error interno al registrar el usuario' });
  }
});

// POST /auth/login
// JSON: { correo, password }
router.post('/auth/login', async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: 'correo y password son obligatorios' });
  }
  if (!isValidEmail(correo)) {
    return res.status(400).json({ error: 'Formato de correo invalido' });
  }

  try {
    const result = await pool.query('SELECT * FROM sp_login($1, $2)', [correo, password]);
    const row = result.rows[0];
    if (!row) {
      return res.status(401).json({ error: 'Correo o contrasena incorrectos' });
    }
    return res.status(200).json(serializeUser(row));
  } catch (err) {
    console.error('Error en /auth/login:', err);
    return res.status(500).json({ error: 'Error interno al iniciar sesion' });
  }
});

// GET /auth/obtenerUsuarios
router.get('/auth/obtenerUsuarios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id_usuario, nombre_completo, correo, foto_perfil FROM usuario'
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error en /auth/obtenerUsuarios:', err);
    return res.status(500).json({ error: 'Error interno al obtener los usuarios' });
  }
});

module.exports = router;
