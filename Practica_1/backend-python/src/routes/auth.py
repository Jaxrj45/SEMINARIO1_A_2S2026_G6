import re
import hashlib
from flask import Blueprint, request, jsonify
from src.db import get_db_connection

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# Ruta de registro
# localhost:5000/auth/register
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    correo = data.get("correo", "").strip().lower()
    nombre_completo = data.get("nombre_completo", "").strip()
    password = data.get("password", "")
    password_confirm = data.get("password_confirm", "")
    foto_perfil = data.get("foto_perfil")  # se conecta a S3 real en la Fase 8

    if not correo or not nombre_completo or not password or not password_confirm:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    if not EMAIL_REGEX.match(correo):
        return jsonify({"error": "Formato de correo inválido"}), 400

    if password != password_confirm:
        return jsonify({"error": "Las contraseñas no coinciden"}), 400

    password_md5 = hashlib.md5(password.encode("utf-8")).hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id_usuario FROM usuario WHERE correo = %s", (correo,))
        if cursor.fetchone():
            return jsonify({"error": "El correo ya está registrado"}), 409

        cursor.execute(
            """
            INSERT INTO usuario (nombre_completo, correo, password_md5, foto_perfil)
            VALUES (%s, %s, %s, %s)
            RETURNING id_usuario
            """,
            (nombre_completo, correo, password_md5, foto_perfil),
        )
        nuevo_id = cursor.fetchone()["id_usuario"]
        conn.commit()

        return (
            jsonify(
                {
                    "id_usuario": nuevo_id,
                    "correo": correo,
                    "nombre_completo": nombre_completo,
                    "foto_perfil": foto_perfil,
                }
            ),
            201,
        )

    except psycopg2.Error as e:
        conn.rollback()
        return jsonify({"error": f"Error de base de datos: {e.pgerror}"}), 400

    finally:
        cursor.close()
        conn.close()


# Ruta de login
# localhost:5000/auth/login
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    correo = data.get("correo", "").strip().lower()
    password = data.get("password", "")

    if not correo or not password:
        return jsonify({"error": "Correo y contraseña son obligatorios"}), 400

    if not EMAIL_REGEX.match(correo):
        return jsonify({"error": "Formato de correo inválido"}), 400

    password_md5 = hashlib.md5(password.encode("utf-8")).hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT id_usuario, correo, nombre_completo, foto_perfil, password_md5 "
            "FROM usuario WHERE correo = %s",
            (correo,),
        )
        usuario = cursor.fetchone()

        if not usuario or usuario["password_md5"] != password_md5:
            return jsonify({"error": "Correo o contraseña incorrectos"}), 401

        return (
            jsonify(
                {
                    "id_usuario": usuario["id_usuario"],
                    "correo": usuario["correo"],
                    "nombre_completo": usuario["nombre_completo"],
                    "foto_perfil": usuario["foto_perfil"],
                }
            ),
            200,
        )

    finally:
        cursor.close()
        conn.close()
