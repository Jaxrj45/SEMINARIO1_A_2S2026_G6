const express = require('express');
const pool = require('../config/db');
const upload = require('../middleware/upload');
const { uploadProfilePhoto, allowedFile } = require('../config/s3');
const { isValidEmail } = require('../utils/validate');
const { serializeUser } = require('../utils/serialize');
const { handleDbError } = require('../utils/dbErrors');
const { getPayload, trimOrNull } = require('../utils/body');

const router = express.Router();

router.get('/auth/check-email', async (req, res) => {
  const correo = trimOrNull((req.query.correo || '').toLowerCase());

  if (!correo) {
    return res.status(400).json({ error: 'correo es obligatorio (query param)' });
  }

  try {
    const result = await pool.query('SELECT sp_existe_correo($1) AS existe', [correo]);
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return handleDbError(err, res, {}, 'GET /auth/check-email');
  }
});

router.post('/auth/register', upload.single('foto_perfil'), async (req, res) => {
  const data = getPayload(req);
  if (!data) {
    return res.status(400).json({ error: 'Cuerpo JSON requerido' });
  }

  const correo = trimOrNull((data.correo || '').toLowerCase());
  const nombre_completo = trimOrNull(data.nombre_completo);
  const password = data.password || '';
  const password_confirm = data.password_confirm || '';

  if (!correo || !nombre_completo || !password || !password_confirm) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (!isValidEmail(correo)) {
    return res.status(400).json({ error: 'Formato de correo invalido' });
  }
  if (password !== password_confirm) {
    return res.status(400).json({ error: 'Las contrasenas no coinciden' });
  }
  if (req.file && !allowedFile(req.file.originalname)) {
    return res.status(400).json({ error: 'Formato no permitido. Usa jpg, jpeg, png o webp' });
  }

  try {
    const fotoPerfilKey = req.file
      ? await uploadProfilePhoto(req.file)
      : trimOrNull(data.foto_perfil);

    const result = await pool.query(
      'SELECT * FROM sp_registrar_usuario($1, $2, $3, $4)',
      [nombre_completo, correo, password, fotoPerfilKey]
    );
    return res.status(201).json(serializeUser(result.rows[0]));
  } catch (err) {
    return handleDbError(
      err,
      res,
      { 23505: 'El correo ya esta registrado' },
      'POST /auth/register'
    );
  }
});

router.post('/auth/login', async (req, res) => {
  const data = getPayload(req);
  if (!data) {
    return res.status(400).json({ error: 'Cuerpo JSON requerido' });
  }

  const correo = trimOrNull((data.correo || '').toLowerCase());
  const password = data.password || '';

  if (!correo || !password) {
    return res.status(400).json({ error: 'Correo y contrasena son obligatorios' });
  }

  try {
    const result = await pool.query('SELECT * FROM sp_login($1, $2)', [correo, password]);
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Correo o contrasena incorrectos' });
    }
    return res.status(200).json(serializeUser(usuario));
  } catch (err) {
    return handleDbError(err, res, {}, 'POST /auth/login');
  }
});

router.post('/auth/forgot-password', async (req, res) => {
  const data = getPayload(req);
  if (!data) {
    return res.status(400).json({ error: 'Cuerpo JSON requerido' });
  }

  const correo = trimOrNull((data.correo || '').toLowerCase());
  const nueva_password = data.nueva_password || '';
  const nueva_password_confirm = data.nueva_password_confirm || '';

  if (!correo || !nueva_password || !nueva_password_confirm) {
    return res
      .status(400)
      .json({ error: 'correo, nueva_password y nueva_password_confirm son obligatorios' });
  }
  if (nueva_password !== nueva_password_confirm) {
    return res.status(400).json({ error: 'Las contrasenas nuevas no coinciden' });
  }

  try {
    const result = await pool.query('SELECT * FROM sp_recuperar_password($1, $2)', [
      correo,
      nueva_password,
    ]);
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return handleDbError(
      err,
      res,
      { P0002: 'No existe una cuenta con ese correo' },
      'POST /auth/forgot-password'
    );
  }
});

router.get('/auth/obtenerUsuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sp_listar_usuarios()');
    return res.status(200).json(result.rows.map(serializeUser));
  } catch (err) {
    return handleDbError(err, res, {}, 'GET /auth/obtenerUsuarios');
  }
});

module.exports = router;
