import psycopg2.errors
from flask import Blueprint, jsonify, request

from src.db import get_db_connection
from src.payload import get_payload
from src.s3_utils import build_image_url

playlist_bp = Blueprint("playlist", __name__, url_prefix="/playlist")


@playlist_bp.route("", methods=["POST"])
def add_to_playlist():
    data = get_payload()
    if data is None:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    id_usuario = data.get("id_usuario")
    id_pelicula = data.get("id_pelicula")

    if not id_usuario or not id_pelicula:
        return jsonify({"error": "id_usuario e id_pelicula son obligatorios"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT * FROM sp_agregar_a_lista(%s::bigint, %s::bigint)",
            (id_usuario, id_pelicula),
        )
        resultado = cursor.fetchone()
        conn.commit()

        if resultado["ya_estaba"]:
            resultado["mensaje"] = "Esta pelicula ya estaba en tu lista"
            return jsonify(resultado), 200

        resultado["mensaje"] = "Pelicula anadida a tu lista de reproduccion"
        return jsonify(resultado), 201

    except psycopg2.errors.CheckViolation:
        conn.rollback()
        return (
            jsonify(
                {"error": "La pelicula es un proximo estreno y no puede agregarse a la lista"}
            ),
            400,
        )

    except psycopg2.errors.NoDataFound:
        conn.rollback()
        return jsonify({"error": "El usuario o la pelicula no existen"}), 404

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
        cursor.execute("SELECT * FROM sp_listar_mi_lista(%s::bigint)", (id_usuario,))
        peliculas = cursor.fetchall()

        for p in peliculas:
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
            "WHERE id_lista = %s::bigint AND id_usuario = %s::bigint",
            (id_lista, id_usuario),
        )
        entrada = cursor.fetchone()

        if not entrada:
            return jsonify({"error": "No se encontro esa entrada en tu lista"}), 404

        cursor.execute(
            "SELECT sp_quitar_de_lista(%s::bigint, %s::bigint)",
            (id_usuario, entrada["id_pelicula"]),
        )
        conn.commit()

        return jsonify({"mensaje": "Pelicula eliminada de tu lista"}), 200

    except psycopg2.errors.NoDataFound:
        conn.rollback()
        return jsonify({"error": "No se encontro esa entrada en tu lista"}), 404

    finally:
        cursor.close()
        conn.close()
