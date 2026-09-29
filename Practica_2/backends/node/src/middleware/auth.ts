import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { err } from '../utils/http';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar';
const JWT_HOURS = Number(process.env.JWT_HOURS || 8);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: number;
    }
  }
}

export function makeToken(user: { id: number; username: string }): string {
  return jwt.sign({ sub: String(user.id), username: user.username }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: `${JWT_HOURS}h`,
  });
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return err(res, 'Token requerido', 401);
  }
  try {
    const data = jwt.verify(header.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
    const userId = Number(typeof data === 'object' ? data.sub : NaN);
    if (!Number.isInteger(userId)) throw new Error('sub invalido');
    req.userId = userId;
  } catch {
    return err(res, 'Token inválido o expirado', 401);
  }
  return next();
}
