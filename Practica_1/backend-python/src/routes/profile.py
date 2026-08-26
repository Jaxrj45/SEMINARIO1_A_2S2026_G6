import hashlib
import psycopg2
from flask import Blueprint, request, jsonify

from src.db import get_db_connection
from src.s3_utils import build_image_url

profile_bp = Blueprint("profile", __name__, url_prefix="/profile")

# Endpoint para actualizar el perfil de un usuario
# localhost:5000/profile
@profile_bp.route("", methods=["PUT"])
def update_profile():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    id_usuario = data.get("id_usuario")
    password_actual = data.get("password")
    nuevo_nombre = data.get("nombre_completo")
    nueva_foto = data.get("foto_perfil")

    if not id_usuario or not password_actual:
        return jsonify({"error": "id_usuario y password son obligatorios"}), 400

    if not nuevo_nombre and not nueva_foto:
        return jsonify({"error": "Debes enviar al menos nombre_completo o foto_perfil"}), 400

    password_md5 = hashlib.md5(password_actual.encode("utf-8")).hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT password_md5 FROM usuario WHERE id_usuario = %s",
            (id_usuario,),
        )
        usuario = cursor.fetchone()

        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404

        if usuario["password_md5"] != password_md5:
            return jsonify({"error": "Contraseña actual incorrecta"}), 401

        campos = []
        valores = []

        if nuevo_nombre:
            campos.append("nombre_completo = %s")
            valores.append(nuevo_nombre.strip())

        if nueva_foto:
            campos.append("foto_perfil = %s")
            valores.append(nueva_foto)

        valores.append(id_usuario)

        cursor.execute(
            f"UPDATE usuario SET {', '.join(campos)} WHERE id_usuario = %s "
            f"RETURNING id_usuario, correo, nombre_completo, foto_perfil",
            tuple(valores),
        )
        actualizado = cursor.fetchone()
        conn.commit()

        actualizado["foto_perfil"] = build_image_url(actualizado["foto_perfil"])
        return jsonify(actualizado), 200

    except psycopg2.errors.CheckViolation:
        # Salta si foto_perfil no cumple el CHECK (debe empezar con "Fotos_Perfil/")
        conn.rollback()
        return jsonify({"error": "La foto de perfil debe tener el formato 'Fotos_Perfil/archivo.jpg'"}), 400

    except psycopg2.Error as e:
        conn.rollback()
        return jsonify({"error": f"Error de base de datos: {e.pgerror}"}), 400

    finally:
        cursor.close()
        conn.close()