import { NextFunction, Request, Response } from 'express';
import { ApiError, fail } from '../utils/http';

export function notFound(req: Request, res: Response) {
  return fail(res, 404, 'NOT_FOUND', 'La ruta no existe');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  if (error instanceof ApiError) {
    return fail(res, error.httpStatus, error.code, error.message, error.fields);
  }

  // Errores de express.json()
  if (error?.type === 'entity.parse.failed') {
    return fail(res, 400, 'VALIDATION_ERROR', 'El JSON de la petición no es válido');
  }
  if (error?.type === 'entity.too.large') {
    return fail(res, 413, 'IMAGE_TOO_LARGE', 'La petición es demasiado grande');
  }

  // Nunca se manda el detalle (SQL, stack) al cliente, solo queda en el log
  console.error('Error no controlado:', error);
  return fail(res, 500, 'INTERNAL_ERROR', 'Ocurrió un error en el servidor');
}
