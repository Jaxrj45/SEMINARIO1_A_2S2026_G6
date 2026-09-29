"""Conexión a Amazon RDS (PostgreSQL). Toda la lógica de datos vive en los
stored procedures de database/sps; el backend solo los invoca con call_sp()."""

import psycopg2
import psycopg2.extras
import psycopg2.pool
from config import Config

UNIQUE_VIOLATION = "23505"

_pool = None


def get_pool():
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.ThreadedConnectionPool(
            1,
            10,
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            dbname=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            sslmode="require" if Config.DB_SSL else "prefer",
        )
    return _pool


def call_sp(name, *args):
    """Ejecuta SELECT * FROM <sp>(%s, %s, ...) y devuelve las filas como dicts."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            placeholders = ", ".join(["%s"] * len(args))
            cur.execute(f"SELECT * FROM {name}({placeholders})", args)
            rows = cur.fetchall()
        conn.commit()
        return rows
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)
