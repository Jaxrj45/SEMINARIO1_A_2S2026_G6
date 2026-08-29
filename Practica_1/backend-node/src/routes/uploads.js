const express = require('express');
const upload = require('../middleware/upload');
const { uploadProfilePhoto, allowedFile, publicUrl } = require('../config/s3');

const router = express.Router();

router.post('/uploads/profile-photo', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No se envio ningun archivo (campo 'file')" });
  }
  if (!req.file.originalname) {
    return res.status(400).json({ error: 'Nombre de archivo vacio' });
  }
  if (!allowedFile(req.file.originalname)) {
    return res.status(400).json({ error: 'Formato no permitido. Usa jpg, jpeg, png o webp' });
  }

  try {
    const key = await uploadProfilePhoto(req.file);
    return res.status(201).json({ key, url: publicUrl(key) });
  } catch (err) {
    if (err.code === 'CredentialsError' || err.code === 'CredentialsNotFound') {
      return res.status(500).json({ error: 'Credenciales de AWS no configuradas en el servidor' });
    }
    console.error('Error en POST /uploads/profile-photo:', err);
    return res.status(502).json({ error: `Error al subir a S3: ${err.message}` });
  }
});

module.exports = router;
