import psycopg2
import psycopg2.errors
from flask import Blueprint, request, jsonify

from src.db import get_db_connection
from src.s3_utils import build_image_url

movies_bp = Blueprint("movies", __name__, url_prefix="/movies")

ESTADOS_VALIDOS = {"DISPONIBLE", "PROXIMO_ESTRENO"}


@movies_bp.route("", methods=["GET"])
def get_movies():

    id_usuario = request.args.get("id_usuario")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM sp_listar_peliculas(%s)", (id_usuario,))
        peliculas = cursor.fetchall()

        for p in peliculas:
            p["poster"] = build_image_url(p["poster"])

        return jsonify(peliculas), 200

    finally:
        cursor.close()
        conn.close()


@movies_bp.route("/<int:id_pelicula>", methods=["GET"])
def get_movie(id_pelicula):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM sp_obtener_pelicula(%s)", (id_pelicula,))
        pelicula = cursor.fetchone()

        if not pelicula:
            return jsonify({"error": "Película no encontrada"}), 404

        pelicula["poster"] = build_image_url(pelicula["poster"])
        return jsonify(pelicula), 200

    finally:
        cursor.close()
        conn.close()


@movies_bp.route("", methods=["POST"])
def create_movie():

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    titulo = data.get("titulo", "").strip()
    director = data.get("director", "").strip()
    anio_estreno = data.get("anio_estreno")
    url_contenido = data.get("url_contenido", "").strip()
    poster = data.get("poster", "").strip()
    estado = data.get("estado", "DISPONIBLE")

    if not titulo or not director or not anio_estreno or not url_contenido or not poster:
        return jsonify({
            "error": "titulo, director, anio_estreno, url_contenido y poster son obligatorios"
        }), 400

    if estado not in ESTADOS_VALIDOS:
        return jsonify({"error": f"estado debe ser uno de: {', '.join(ESTADOS_VALIDOS)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT * FROM sp_crear_pelicula(%s, %s, %s::smallint, %s, %s, %s)",
            (titulo, director, anio_estreno, url_contenido, poster, estado),
        )
        nueva = cursor.fetchone()
        conn.commit()
        return jsonify(nueva), 201

    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Ya existe una película con ese título, director y año"}), 409

    finally:
        cursor.close()
        conn.close()


@movies_bp.route("/<int:id_pelicula>", methods=["PUT"])
def update_movie(id_pelicula):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    estado = data.get("estado")
    if estado and estado not in ESTADOS_VALIDOS:
        return jsonify({"error": f"estado debe ser uno de: {', '.join(ESTADOS_VALIDOS)}"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
       
        cursor.execute(
            "SELECT * FROM sp_actualizar_pelicula(%s, %s, %s, %s::smallint, %s, %s, %s)",
            (
                id_pelicula,
                data.get("titulo"),
                data.get("director"),
                data.get("anio_estreno"),
                data.get("url_contenido"),
                data.get("poster"),
                estado,
            ),
        )
        actualizada = cursor.fetchone()
        conn.commit()

        actualizada["poster"] = build_image_url(actualizada["poster"])
        return jsonify(actualizada), 200

    except psycopg2.errors.NoDataFound:
        conn.rollback()
        return jsonify({"error": "Película no encontrada"}), 404

    finally:
        cursor.close()
        conn.close()


@movies_bp.route("/<int:id_pelicula>", methods=["DELETE"])
def delete_movie(id_pelicula):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT sp_eliminar_pelicula(%s)", (id_pelicula,))
        conn.commit()
        return jsonify({"mensaje": "Película eliminada"}), 200

    except psycopg2.errors.NoDataFound:
        conn.rollback()
        return jsonify({"error": "Película no encontrada"}), 404

    finally:
        cursor.close()
        conn.close()