const STATUS_BY_CODE = {
  23505: 409,
  P0002: 404,
  23514: 400,
  '28P01': 401,
};

function handleDbError(err, res, mensajes, contexto) {
  const status = STATUS_BY_CODE[err.code];
  if (status && mensajes && mensajes[err.code]) {
    return res.status(status).json({ error: mensajes[err.code] });
  }
  console.error(`Error en ${contexto}:`, err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

module.exports = { handleDbError };
