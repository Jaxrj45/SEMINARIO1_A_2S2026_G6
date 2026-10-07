import { Router } from 'express';
import { callSp, UNIQUE_VIOLATION } from '../config/db';
import { makeToken } from '../middleware/auth';
import { err, text } from '../utils/http';
import { UserRow, userToDict } from '../utils/serialize';

const router = Router();

// JSON. La foto de perfil ya fue subida por Lambda / Azure Functions: llega su URL en profileImageUrl
router.post('/register', async (req, res, next) => {
  const data = req.body || {};
  const username = text(data.username);
  const email = text(data.email);
  const password = typeof data.password === 'string' ? data.password : '';
  const confirm = typeof data.confirmPassword === 'string' ? data.confirmPassword : '';
  const imageUrl = text(data.profileImageUrl) || null;

  if (!username || !email || !password) {
    return err(res, 'username, email y password son obligatorios', 400);
  }
  if (password !== confirm) {
    return err(res, 'Las contraseñas no coinciden', 400);
  }
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    return err(res, 'profileImageUrl debe ser http(s)', 400);
  }

  try {
    // El SP encripta la contrasena con bcrypt (pgcrypto)
    const [user] = await callSp<UserRow>(
      'sp_registrar_usuario',
      username,
      email,
      password,
      imageUrl
    );
    return res.status(201).json({ message: 'Usuario registrado', user: userToDict(user) });
  } catch (e: any) {
    if (e.code === UNIQUE_VIOLATION) return err(res, 'El nombre de usuario ya existe', 409);
    return next(e);
  }
});

router.post('/login', async (req, res, next) => {
  const data = req.body || {};
  const username = typeof data.username === 'string' ? data.username : '';
  const password = typeof data.password === 'string' ? data.password : '';

  try {
    const [user] = await callSp<UserRow>('sp_login', username, password);
    if (!user) return err(res, 'Credenciales inválidas', 401);
    return res.status(200).json({ token: makeToken(user), user: userToDict(user) });
  } catch (e) {
    return next(e);
  }
});

export default router;
