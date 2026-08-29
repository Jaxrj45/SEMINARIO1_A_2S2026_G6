import psycopg2.errors
from flask import Blueprint, jsonify, request

from src.db import get_db_connection
from src.payload import get_payload, trim_or_none
from src.s3_utils import allowed_file, build_image_url, upload_profile_photo

profile_bp = Blueprint("profile", __name__, url_prefix="/profile")


@profile_bp.route("/<int:id_usuario>", methods=["GET"])
def get_profile(id_usuario):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM sp_obtener_perfil(%s::bigint)", (id_usuario,))
        perfil = cursor.fetchone()

        if not perfil:
            return jsonify({"error": "Usuario no encontrado"}), 404

        perfil["foto_perfil"] = build_image_url(perfil["foto_perfil"])
        return jsonify(perfil), 200

    finally:
        cursor.close()
        conn.close()


@profile_bp.route("", methods=["PUT"])
def update_profile():
    data = get_payload()
    if data is None:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    id_usuario = data.get("id_usuario")
    password_actual = data.get("password", "")
    nuevo_nombre = trim_or_none(data.get("nombre_completo"))
    nueva_foto = trim_or_none(data.get("foto_perfil"))
    archivo = request.files.get("foto_perfil")

    if not id_usuario or not password_actual:
        return jsonify({"error": "id_usuario y password son obligatorios"}), 400

    if not nuevo_nombre and not nueva_foto and not archivo:
        return jsonify({"error": "Debes enviar al menos nombre_completo o foto_perfil"}), 400

    if archivo and not allowed_file(archivo.filename):
        return jsonify({"error": "Formato no permitido. Usa jpg, jpeg, png o webp"}), 400

    if archivo:
        nueva_foto = upload_profile_photo(archivo)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT * FROM sp_actualizar_perfil(%s::bigint, %s, %s, %s)",
            (id_usuario, nuevo_nombre, nueva_foto, password_actual),
        )
        actualizado = cursor.fetchone()
        conn.commit()

        actualizado["foto_perfil"] = build_image_url(actualizado["foto_perfil"])
        return jsonify(actualizado), 200

    except psycopg2.errors.InvalidPassword:
        conn.rollback()
        return jsonify({"error": "Contrasena actual incorrecta"}), 401

    except psycopg2.errors.NoDataFound:
        conn.rollback()
        return jsonify({"error": "Usuario no encontrado"}), 404

    finally:
        cursor.close()
        conn.close()
