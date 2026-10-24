import { ApiError } from './http';

export const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,50}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DPI_RE = /^\d{13}$/;
export const MIN_PASSWORD = 8;

// Si hay campos con error corta la ruta con 400 VALIDATION_ERROR
export function throwIfInvalid(fields: Record<string, string>) {
  if (Object.keys(fields).length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Datos inválidos', fields);
  }
}

// Texto para LIKE '%...%' sin que % y _ del usuario funcionen como comodines
export function likePattern(value: string): string {
  return `%${value.replace(/[\\%_]/g, '\\$&')}%`;
}

// Quita el "data:image/jpeg;base64," si el frontend lo manda
export function cleanBase64(value: string): string {
  return value.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
}
