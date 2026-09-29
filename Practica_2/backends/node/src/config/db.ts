import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

// Ejecuta SELECT * FROM <sp>($1, $2, ...) y devuelve las filas
export async function callSp<T>(name: string, ...args: unknown[]): Promise<T[]> {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(', ');
  const result = await pool.query(`SELECT * FROM ${name}(${placeholders})`, args);
  return result.rows as T[];
}

// Codigo de PostgreSQL para violacion de UNIQUE
export const UNIQUE_VIOLATION = '23505';
