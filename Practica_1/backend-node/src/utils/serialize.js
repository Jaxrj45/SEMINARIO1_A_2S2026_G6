const { publicUrl } = require('../config/s3');

function withImageUrl(row, field) {
  if (!row) return row;
  return { ...row, [field]: publicUrl(row[field]) };
}

const serializeUser = (row) => withImageUrl(row, 'foto_perfil');
const serializeMovie = (row) => withImageUrl(row, 'poster');
const serializePlaylistItem = (row) => withImageUrl(row, 'poster');

module.exports = { withImageUrl, serializeUser, serializeMovie, serializePlaylistItem };
