import os

import psycopg2
from psycopg2.extras import RealDictCursor


def get_db_connection():
    sslmode = "require" if os.environ.get("DB_SSL") == "true" else "disable"

    return psycopg2.connect(
        host=os.environ.get("DB_HOST"),
        port=os.environ.get("DB_PORT", 5432),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        dbname=os.environ.get("DB_NAME"),
        sslmode=sslmode,
        options="-c search_path=cloudcinema,public",
        cursor_factory=RealDictCursor,  # los resultados vienen como dict, no tuplas
    )
