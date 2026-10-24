import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { fail } from '../utils/http';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: number;
      username: string;
    }
  }
}

export interface TokenUser {
  userId: number;
  username: string;
}

// sub va como texto: Python rechaza el token si sub es numero
export function makeToken(user: { id: number; username: string }): string {
  return jwt.sign({ sub: String(user.id), username: user.username }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtHours * 3600,
  });
}

// Lanza TokenExpiredError o JsonWebTokenError si el token no sirve.
// Tambien lo usa el WebSocket del chat, que recibe el token en la URL.
export function readToken(token: string): TokenUser {
  const data = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  if (typeof data !== 'object') throw new jwt.JsonWebTokenError('token invalido');

  const userId = Number(data.sub);
  if (!Number.isInteger(userId) || userId <= 0) throw new jwt.JsonWebTokenError('sub invalido');

  return { userId, username: String(data.username || '') };
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return fail(res, 401, 'UNAUTHORIZED', 'Debes iniciar sesión');
  }

  try {
    const user = readToken(header.slice(7));
    req.userId = user.userId;
    req.username = user.username;
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      return fail(res, 401, 'TOKEN_EXPIRED', 'Tu sesión expiró, vuelve a iniciar sesión');
    }
    return fail(res, 401, 'UNAUTHORIZED', 'Sesión inválida');
  }

  return next();
}
