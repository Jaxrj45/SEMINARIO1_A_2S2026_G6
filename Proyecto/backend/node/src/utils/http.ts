import { Response } from 'express';

// Formato de respuesta del contrato: { status, message, data }

export function ok(res: Response, message: string, data: unknown = null, httpStatus = 200) {
  return res.status(httpStatus).json({ status: 'success', message, data });
}

export function fail(
  res: Response,
  httpStatus: number,
  code: string,
  message: string,
  fields?: Record<string, string>
) {
  const data: { code: string; fields?: Record<string, string> } = { code };
  if (fields) data.fields = fields;
  return res.status(httpStatus).json({ status: 'error', message, data });
}

// Para cortar una ruta desde cualquier parte con: throw new ApiError(404, 'NOT_FOUND', '...')
// El manejador de errores de server.ts lo convierte en la respuesta.
export class ApiError extends Error {
  constructor(
    public httpStatus: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
  }
}
