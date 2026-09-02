const express = require('express');
const pool = require('../config/db');
const upload = require('../middleware/upload');
const { uploadProfilePhoto, allowedFile } = require('../config/s3');
const { serializeUser } = require('../utils/serialize');
const { handleDbError } = require('../utils/dbErrors');
const { getPayload, trimOrNull } = require('../utils/body');

const router = express.Router();

router.get('/profile/:id_usuario', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sp_obtener_perfil($1::bigint)', [
      req.params.id_usuario,
    ]);
    const perfil = result.rows[0];

    if (!perfil) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.status(200).json(serializeUser(perfil));
  } catch (err) {
    return handleDbError(err, res, {}, 'GET /profile/:id_usuario');
  }
});

router.put('/profile', upload.single('foto_perfil'), async (req, res) => {
  const data = getPayload(req);
  if (!data) {
    return res.status(400).json({ error: 'Cuerpo JSON requerido' });
  }

  const id_usuario = data.id_usuario;
  const password_actual = data.password || '';
  const nuevo_nombre = trimOrNull(data.nombre_completo);
  const nueva_foto = trimOrNull(data.foto_perfil);

  if (!id_usuario || !password_actual) {
    return res.status(400).json({ error: 'id_usuario y password son obligatorios' });
  }
  if (!nuevo_nombre && !nueva_foto && !req.file) {
    return res
      .status(400)
      .json({ error: 'Debes enviar al menos nombre_completo o foto_perfil' });
  }
  if (req.file && !allowedFile(req.file.originalname)) {
    return res.status(400).json({ error: 'Formato no permitido. Usa jpg, jpeg, png o webp' });
  }

  try {
    const fotoPerfilKey = req.file ? await uploadProfilePhoto(req.file) : nueva_foto;

    const result = await pool.query(
      'SELECT * FROM sp_actualizar_perfil($1::bigint, $2, $3, $4)',
      [id_usuario, nuevo_nombre, fotoPerfilKey, password_actual]
    );
    return res.status(200).json(serializeUser(result.rows[0]));
  } catch (err) {
    return handleDbError(
      err,
      res,
      { P0002: 'Usuario no encontrado', '28P01': 'Contrasena actual incorrecta' },
      'PUT /profile'
    );
  }
});

module.exports = router;
