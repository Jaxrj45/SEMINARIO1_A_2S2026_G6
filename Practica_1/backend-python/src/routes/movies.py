from src.db import get_db_connection
from flask import Blueprint, jsonify

movie_bp = Blueprint("movies", __name__)


# Endpoint para obtener la lista de películas
# localhost:5000/movies/get_movies
@movie_bp.route("/get_movies", methods=["GET"])
def get_movies():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT id_pelicula, titulo, director, anio_estreno,
                   url_contenido, poster, estado, se_puede_agregar
            FROM v_cartelera
            ORDER BY anio_estreno DESC
            """)
        peliculas = cursor.fetchall()
        return jsonify(peliculas), 200

    finally:
        cursor.close()
        conn.close()
