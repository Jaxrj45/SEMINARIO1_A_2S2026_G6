import { Router } from 'express';
import { isDuplicate, run } from '../config/db';
import { makeToken } from '../middleware/auth';
import { assertCognitoConfirmed, assertCognitoSignup, verifyIdToken } from '../services/cognito';
import { compareFace } from '../services/faceApi';
import { findUserByCognitoSub, findUserById, findUserByUsername } from '../services/users';
import { text } from '../utils/format';
import { handler } from '../utils/handler';
import { ApiError, ok } from '../utils/http';
import { UsuarioRow, userToJson } from '../utils/serialize';
import {
  cleanBase64,
  DPI_RE,
  EMAIL_RE,
  MIN_PASSWORD,
  throwIfInvalid,
  USERNAME_RE,
} from '../utils/validate';

const router = Router();

// Respuesta de login: nuestro token + el perfil
const sessionData = (user: UsuarioRow) => ({ token: makeToken(user), user: userToJson(user) });

// Cual campo UNIQUE se repitio, segun el nombre del indice en schema.sql
function duplicateError(e: any): ApiError {
  const message = String(e?.sqlMessage || '');
  const fields: Record<string, string> = {};
  if (message.includes('uq_usuarios_username')) fields.username = 'Ya está en uso';
  if (message.includes('uq_usuarios_email')) fields.email = 'Ya está registrado';
  if (message.includes('uq_usuarios_dpi')) fields.dpi = 'Ya está registrado';
  if (message.includes('uq_usuarios_cognito_sub')) fields.cognitoSub = 'Ya está registrado';
  return new ApiError(409, 'ALREADY_EXISTS', 'El usuario, correo o DPI ya está registrado', fields);
}

// POST /api/auth/register
// El frontend ya subio la foto (upload/profile) y ya hizo el signUp en Cognito
router.post(
  '/register',
  handler(async (req, res) => {
    const body = req.body || {};
    const data = {
      username: text(body.username),
      fullName: text(body.fullName),
      email: text(body.email).toLowerCase(),
      dpi: text(body.dpi),
      password: typeof body.password === 'string' ? body.password : '',
      cognitoSub: text(body.cognitoSub),
      photoKey: text(body.photoKey),
    };

    const fields: Record<string, string> = {};
    if (!USERNAME_RE.test(data.username)) {
      fields.username = 'De 3 a 50 caracteres: letras, números, punto, guion o guion bajo';
    }
    if (!data.fullName || data.fullName.length > 150) fields.fullName = 'Es obligatorio (máximo 150 caracteres)';
    if (!EMAIL_RE.test(data.email) || data.email.length > 150) fields.email = 'Correo inválido';
    if (!DPI_RE.test(data.dpi)) fields.dpi = 'Debe tener 13 dígitos';
    if (data.password.length < MIN_PASSWORD) fields.password = `Mínimo ${MIN_PASSWORD} caracteres`;
    if (!data.cognitoSub) fields.cognitoSub = 'Es obligatorio';
    if (!data.photoKey.startsWith('Fotos_Perfil/')) fields.photoKey = 'La foto de perfil es obligatoria';
    throwIfInvalid(fields);

    await assertCognitoSignup(data.username, data.cognitoSub);

    let userId: number;
    try {
      const result = await run(
        `INSERT INTO usuarios (cognito_sub, username, nombre_completo, email, dpi, password_md5, foto_key)
         VALUES (?, ?, ?, ?, ?, MD5(?), ?)`,
        [data.cognitoSub, data.username, data.fullName, data.email, data.dpi, data.password, data.photoKey]
      );
      userId = result.insertId;
    } catch (e) {
      if (isDuplicate(e)) throw duplicateError(e);
      throw e;
    }

    const user = (await findUserById(userId))!;
    return ok(
      res,
      'Usuario registrado. Revisa tu correo para verificar la cuenta.',
      { user: userToJson(user) },
      201
    );
  })
);

// POST /api/auth/session
// Login con usuario y contrasena: el frontend inicia sesion en Cognito y manda el idToken
router.post(
  '/session',
  handler(async (req, res) => {
    const idToken = text(req.body?.idToken);
    throwIfInvalid(idToken ? {} : { idToken: 'Es obligatorio' });

    const cognito = await verifyIdToken(idToken);
    const user = await findUserByCognitoSub(cognito.sub);
    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'El usuario no está registrado en Semi-Social');
    }

    return ok(res, 'Sesión iniciada', sessionData(user));
  })
);

// POST /api/auth/face-session
// Login facial: compara la foto de la camara con la foto de perfil
router.post(
  '/face-session',
  handler(async (req, res) => {
    const username = text(req.body?.username);
    const imageBase64 = typeof req.body?.imageBase64 === 'string' ? cleanBase64(req.body.imageBase64) : '';

    const fields: Record<string, string> = {};
    if (!username) fields.username = 'Es obligatorio';
    if (!imageBase64) fields.imageBase64 = 'La foto es obligatoria';
    throwIfInvalid(fields);

    // Mismo mensaje si no existe el usuario o si no es su cara, para no revelar quien esta registrado
    const user = await findUserByUsername(username);
    if (!user) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Usuario o rostro incorrecto');
    }

    await assertCognitoConfirmed(user.username);

    const result = await compareFace(imageBase64, user.foto_key);
    if (!result.match) {
      throw new ApiError(401, 'FACE_NOT_MATCHED', 'El rostro no coincide con la foto de perfil');
    }

    return ok(res, 'Sesión iniciada', sessionData(user));
  })
);

export default router;
