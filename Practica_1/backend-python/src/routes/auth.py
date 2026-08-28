import re
import psycopg2
import psycopg2.errors
from flask import Blueprint, request, jsonify

from src.db import get_db_connection
from src.s3_utils import build_image_url

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# endpoint para validar si un correo ya está registrado en la base de datos
# el endpoint es: GET  /auth/check-email
@auth_bp.route("/check-email", methods=["GET"])
def check_email():
    correo = request.args.get("correo", "").strip().lower()

    if not correo:
        return jsonify({"error": "correo es obligatorio (query param)"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT sp_existe_correo(%s) AS existe", (correo,))
        resultado = cursor.fetchone()
        return jsonify(resultado), 200

    finally:
        cursor.close()
        conn.close()


# endpoint para registrar un nuevo usuario
# el endpoint es: POST /auth/register
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    correo = data.get("correo", "").strip().lower()
    nombre_completo = data.get("nombre_completo", "").strip()
    password = data.get("password", "")
    password_confirm = data.get("password_confirm", "")
    foto_perfil = data.get("foto_perfil")

    if not correo or not nombre_completo or not password or not password_confirm:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    if not EMAIL_REGEX.match(correo):
        return jsonify({"error": "Formato de correo inválido"}), 400

    if password != password_confirm:
        return jsonify({"error": "Las contraseñas no coinciden"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
     
        cursor.execute(
            "SELECT * FROM sp_registrar_usuario(%s, %s, %s, %s)",
            (nombre_completo, correo, password, foto_perfil),
        )
        nuevo = cursor.fetchone()
        conn.commit()

        nuevo["foto_perfil"] = build_image_url(nuevo["foto_perfil"])
        return jsonify(nuevo), 201

    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "El correo ya está registrado"}), 409

    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    correo = data.get("correo", "").strip().lower()
    password = data.get("password", "")

    if not correo or not password:
        return jsonify({"error": "Correo y contraseña son obligatorios"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        
        cursor.execute("SELECT * FROM sp_login(%s, %s)", (correo, password))
        usuario = cursor.fetchone()

        if not usuario:
            return jsonify({"error": "Correo o contraseña incorrectos"}), 401

        usuario["foto_perfil"] = build_image_url(usuario["foto_perfil"])
        return jsonify(usuario), 200

    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
  
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    correo = data.get("correo", "").strip().lower()
    nueva_password = data.get("nueva_password", "")
    nueva_password_confirm = data.get("nueva_password_confirm", "")

    if not correo or not nueva_password or not nueva_password_confirm:
        return jsonify({"error": "correo, nueva_password y nueva_password_confirm son obligatorios"}), 400

    if nueva_password != nueva_password_confirm:
        return jsonify({"error": "Las contraseñas nuevas no coinciden"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "SELECT * FROM sp_recuperar_password(%s, %s)",
            (correo, nueva_password),
        )
        resultado = cursor.fetchone()
        conn.commit()
        return jsonify(resultado), 200

    except psycopg2.errors.NoDataFound:
        conn.rollback()
        return jsonify({"error": "No existe una cuenta con ese correo"}), 404

    finally:
        cursor.close()
        conn.close()