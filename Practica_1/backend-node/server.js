// CloudCinema - Backend Node.js/Express
// Responsable: Integrante B (Backend Node.js Lead)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN } : {}));
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'node' });
});

app.use(require('./src/routes/auth'));
app.use(require('./src/routes/movies'));
app.use(require('./src/routes/playlist'));
app.use(require('./src/routes/profile'));

app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ error: `Error al subir el archivo: ${err.message}` });
  }
  console.error('Error no manejado:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor Node.js escuchando en puerto ${PORT}`);
});
