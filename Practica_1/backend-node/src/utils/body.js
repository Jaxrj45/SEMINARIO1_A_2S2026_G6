function getPayload(req) {
  const body = req.body;
  if (!body || (typeof body === 'object' && Object.keys(body).length === 0 && !req.file)) {
    return null;
  }
  return body;
}

function trimOrNull(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

module.exports = { getPayload, trimOrNull };
