// Multer en memoria: recibe el archivo como buffer para subirlo directo a S3
// (nunca se guarda en disco ni en la base de datos, solo la key resultante).
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
