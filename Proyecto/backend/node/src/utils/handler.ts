import { NextFunction, Request, RequestHandler, Response } from 'express';

// Express 4 no atrapa los errores de las funciones async.
// Con esto cualquier throw (ApiError o error de MySQL) llega al manejador de errores.
export const handler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
