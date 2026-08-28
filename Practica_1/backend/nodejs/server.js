// CloudCinema - Backend Node.js / Express
// Esta instancia y la de Python deben exponer los mismos endpoints
// para que el balanceador de carga sea transparente.

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SERVER_NAME = process.env.SERVER_NAME || 'node';

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    server: SERVER_NAME,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${SERVER_NAME}] escuchando en el puerto ${PORT}`);
});
