// CloudCinema - Backend Node.js/Express
// Responsable: Integrante B (Backend Node.js Lead)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const rawOrigins = process.env.CORS_ORIGIN;
const allowedOrigins = rawOrigins 
  ? rawOrigins.split(',').map(origin => origin.trim()) 
  : '*';

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SERVER_NAME = process.env.SERVER_NAME || 'node';

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', server: SERVER_NAME });
});

app.use(require('./src/routes/auth'));
app.use(require('./src/routes/movies'));
app.use(require('./src/routes/playlist'));
app.use(require('./src/routes/profile'));
app.use(require('./src/routes/uploads'));

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ error: `Error al subir el archivo: ${err.message}` });
  }
  console.error('Error no manejado:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${SERVER_NAME}] escuchando en el puerto ${PORT}`);
});
