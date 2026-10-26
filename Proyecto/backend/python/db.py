"""Conexion a MySQL (Amazon RDS) con un pool de conexiones."""

from contextlib import contextmanager

import pymysql
from dbutils.pooled_db import PooledDB

from config import Config

_pool = PooledDB(
    creator=pymysql,
    maxconnections=10,
    blocking=True,
    host=Config.DB_HOST,
    port=Config.DB_PORT,
    database=Config.DB_NAME,
    user=Config.DB_USER,
    password=Config.DB_PASSWORD,
    charset="utf8mb4",
    cursorclass=pymysql.cursors.DictCursor,
    autocommit=True,
    # La sesion en UTC; las fechas se guardan con UTC_TIMESTAMP() (ver db/schema.sql)
    init_command="SET time_zone = '+00:00'",
)


def query(sql, params=()):
    """SELECT: devuelve las filas como diccionarios."""
    conn = _pool.connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return list(cur.fetchall())
    finally:
        conn.close()


def run(sql, params=()):
    """INSERT, UPDATE y DELETE: devuelve el id insertado."""
    conn = _pool.connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.lastrowid
    finally:
        conn.close()


@contextmanager
def transaction():
    """Uso: with transaction() as cur: ...  Si algo falla adentro se hace rollback."""
    conn = _pool.connection()
    try:
        conn.begin()
        with conn.cursor() as cur:
            yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def is_duplicate(error):
    """Error de MySQL cuando se repite un valor UNIQUE (username, email, dpi, etc.)."""
    return isinstance(error, pymysql.err.IntegrityError) and error.args[0] == 1062


def check_connection():
    query("SELECT 1")
