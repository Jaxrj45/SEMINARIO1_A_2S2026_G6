from flask import Blueprint, jsonify

from src.db import get_db_connection
from src.s3_utils import build_image_url

movies_bp = Blueprint("movies", __name__, url_prefix="/movies")

# Endpoint para obtener la lista de películas en cartelera
# localhost:5000/movies
@movies_bp.route("", methods=["GET"])
def get_movies():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT id_pelicula, titulo, director, anio_estreno,
                   url_contenido, poster, estado, se_puede_agregar
            FROM v_cartelera
            ORDER BY anio_estreno DESC
            """
        )
        peliculas = cursor.fetchall()

        for p in peliculas:
            p["poster"] = build_image_url(p["poster"])

        return jsonify(peliculas), 200

    finally:
        cursor.close()
        conn.close()