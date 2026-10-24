import { env } from '../config/env';

// Fecha en el formato del contrato: "2026-10-24T15:30:00Z" (UTC, con Z y sin milisegundos)
export function toIso(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? value : new Date(`${String(value).replace(' ', 'T')}Z`);
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// URL publica de una imagen a partir de su key en el bucket
export function s3Url(key: string | null | undefined): string | null {
  if (!key) return null;
  const path = key.split('/').map(encodeURIComponent).join('/');
  return `${env.s3BucketUrl}/${path}`;
}

// Texto del body sin espacios al inicio y al final ('' si no es texto)
export function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

// Id numerico de la URL o del body (null si no es un entero positivo)
export function toId(value: unknown): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
