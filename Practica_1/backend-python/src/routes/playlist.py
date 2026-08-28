import psycopg2
import psycopg2.errors
from flask import Blueprint, request, jsonify

from src.db import get_db_connection
from src.s3_utils import build_image_url

playlist_bp = Blueprint("playlist", __name__, url_prefix="/playlist")


@playlist_bp.route("", methods=["POST"])
def add_to_playlist():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    id_usuario = data.get("id_usuario")
    id_pelicula = data.get("id_pelicula")

    if not id_usuario or not id_pelicula:
        return jsonify({"error": "id_usuario e id_pelicula son obligatorios"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT * FROM sp_agregar_a_lista(%s, %s)",
            (id_usuario, id_pelicula),
        )
        resultado = cursor.fetchone()
        conn.commit()

      
        resultado["agregada_en"] = resultado["agregada_en"].isoformat()

        if resultado["ya_estaba"]:
            resultado["mensaje"] = "Esta película ya estaba en tu lista"
            return jsonify(resultado), 200

        resultado["mensaje"] = "Película añadida a tu lista de reproducción"
        return jsonify(resultado), 201

    except psycopg2.errors.CheckViolation:
        # sp_agregar_a_lista lanza esto (ERRCODE check_violation) cuando
        # la película es PROXIMO_ESTRENO.
        conn.rollback()
        return jsonify({"error": "La película es un próximo estreno y no puede agregarse a la lista"}), 400

    except psycopg2.errors.NoDataFound:
        conn.rollback()
        return jsonify({"error": "El usuario o la película no existen"}), 404

    finally:
        cursor.close()
        conn.close()


@playlist_bp.route("", methods=["GET"])
def get_playlist():
    id_usuario = request.args.get("id_usuario")

    if not id_usuario:
        return jsonify({"error": "id_usuario es obligatorio (query param)"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM sp_listar_mi_lista(%s)", (id_usuario,))
        peliculas = cursor.fetchall()

        for p in peliculas:
            p["agregada_en"] = p["agregada_en"].isoformat()
            p["poster"] = build_image_url(p["poster"])

        return jsonify(peliculas), 200

    finally:
        cursor.close()
        conn.close()


@playlist_bp.route("/<int:id_lista>", methods=["DELETE"])
def remove_from_playlist(id_lista):
 
    id_usuario = request.args.get("id_usuario")

    if not id_usuario:
        return jsonify({"error": "id_usuario es obligatorio (query param)"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT id_pelicula FROM lista_reproduccion "
            "WHERE id_lista = %s AND id_usuario = %s",
            (id_lista, id_usuario),
        )
        entrada = cursor.fetchone()

        if not entrada:
            return jsonify({"error": "No se encontró esa entrada en tu lista"}), 404

        cursor.execute(
            "SELECT sp_quitar_de_lista(%s, %s)",
            (id_usuario, entrada["id_pelicula"]),
        )
        conn.commit()

        return jsonify({"mensaje": "Película eliminada de tu lista"}), 200

    finally:
        cursor.close()
        conn.close()