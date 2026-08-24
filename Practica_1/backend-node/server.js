// CloudCinema - Backend Node.js/Express
// Responsable: Integrante B (Backend Node.js Lead)

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// TODO (Integrante B): mover cada bloque a src/routes/*.js conforme se implemente
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'node' });
});

// app.use('/register', require('./src/routes/auth'));
// app.use('/login', require('./src/routes/auth'));
// app.use('/movies', require('./src/routes/movies'));
// app.use('/playlist', require('./src/routes/playlist'));
// app.use('/profile', require('./src/routes/profile'));

app.listen(PORT, () => {
  console.log(`Servidor Node.js escuchando en puerto ${PORT}`);
});
