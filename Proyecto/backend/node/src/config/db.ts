import mysql, { ResultSetHeader } from 'mysql2/promise';
import { env } from './env';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  charset: 'utf8mb4',
  // Las fechas de MySQL se leen y se escriben como UTC
  timezone: 'Z',
  // DECIMAL y SUM llegan como numero y no como texto
  decimalNumbers: true,
  connectionLimit: 10,
});

// Las fechas se guardan con UTC_TIMESTAMP() (ver db/schema.sql), no con NOW()

// SELECT: devuelve las filas.
// Se usa pool.query y no pool.execute porque execute falla con LIMIT ? en MySQL 8.
export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

// INSERT, UPDATE y DELETE: devuelve insertId y affectedRows
export async function run(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [result] = await pool.query(sql, params);
  return result as ResultSetHeader;
}

// Error de MySQL cuando se repite un valor UNIQUE (username, email, dpi, etc.)
export const isDuplicate = (e: any) => e?.code === 'ER_DUP_ENTRY';
