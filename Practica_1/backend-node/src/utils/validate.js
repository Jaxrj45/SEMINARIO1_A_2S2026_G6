// Misma regla de formato de correo que la restriccion CHECK de database/schema.sql
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i;

function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email);
}

module.exports = { isValidEmail };
