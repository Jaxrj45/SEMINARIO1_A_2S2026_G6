import { Response } from 'express';

// Formato de error comun a ambos backends: { "error": "mensaje" }
export function err(res: Response, msg: string, code: number) {
  return res.status(code).json({ error: msg });
}

export function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
