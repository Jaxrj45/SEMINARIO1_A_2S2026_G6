import psycopg2
import psycopg2.errors
from flask import Blueprint, request, jsonify

from src.db import get_db_connection

playlist_bp = Blueprint("playlist", __name__, url_prefix="/playlist")


# Endpoint para añadir una película a la lista de reproducción de un usuario
# localhost:5000/playlist
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
            """
            INSERT INTO lista_reproduccion (id_usuario, id_pelicula)
            VALUES (%s, %s)
            RETURNING id_lista, agregada_en
            """,
            (id_usuario, id_pelicula),
        )
        nueva = cursor.fetchone()
        conn.commit()

        return (
            jsonify(
                {
                    "id_lista": nueva["id_lista"],
                    "id_usuario": id_usuario,
                    "id_pelicula": id_pelicula,
                    "agregada_en": nueva["agregada_en"].isoformat(),
                    "mensaje": "Película añadida a tu lista de reproducción",
                }
            ),
            201,
        )

    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "Esta película ya está en tu lista"}), 409

    except (psycopg2.errors.RaiseException, psycopg2.errors.CheckViolation) as e:
        conn.rollback()
        mensaje_limpio = str(e).split("CONTEXT:")[0].strip()
        return jsonify({"error": mensaje_limpio}), 400

    except psycopg2.errors.ForeignKeyViolation:
        conn.rollback()
        return jsonify({"error": "El usuario o la película no existen"}), 404

    except Exception as e:
        conn.rollback()
        return jsonify({"error": "Error interno del servidor", "detalle": str(e)}), 500

    finally:
        cursor.close()
        conn.close()


# Endpoint para obtener la lista de reproducción de un usuario
# localhost:5000/playlist?id_usuario=1
@playlist_bp.route("", methods=["GET"])
def get_playlist():
    id_usuario = request.args.get("id_usuario")

    if not id_usuario:
        return jsonify({"error": "id_usuario es obligatorio (query param)"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT id_lista, id_pelicula, titulo, director,
                   anio_estreno, url_contenido, poster, agregada_en
            FROM v_mi_lista
            WHERE id_usuario = %s
            ORDER BY agregada_en DESC
            """,
            (id_usuario,),
        )
        peliculas = cursor.fetchall()

        for p in peliculas:
            p["agregada_en"] = p["agregada_en"].isoformat()

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
        # El WHERE incluye id_usuario para que un usuario NO pueda borrar
        # una entrada de la lista de otro usuario adivinando el id_lista.
        cursor.execute(
            "DELETE FROM lista_reproduccion WHERE id_lista = %s AND id_usuario = %s",
            (id_lista, id_usuario),
        )
        filas_borradas = cursor.rowcount
        conn.commit()

        if filas_borradas == 0:
            return jsonify({"error": "No se encontró esa entrada en tu lista"}), 404

        return jsonify({"mensaje": "Película eliminada de tu lista"}), 200

    finally:
        cursor.close()
        conn.close()
