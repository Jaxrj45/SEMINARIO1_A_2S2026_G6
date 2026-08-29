import re

import psycopg2.errors
from flask import Blueprint, jsonify, request

from src.db import get_db_connection
from src.payload import get_payload, trim_or_none
from src.s3_utils import allowed_file, build_image_url, upload_profile_photo

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


@auth_bp.route("/check-email", methods=["GET"])
def check_email():
    correo = trim_or_none(request.args.get("correo", "").lower())

    if not correo:
        return jsonify({"error": "correo es obligatorio (query param)"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT sp_existe_correo(%s) AS existe", (correo,))
        return jsonify(cursor.fetchone()), 200

    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/register", methods=["POST"])
def register():
    data = get_payload()
    if data is None:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    correo = trim_or_none(data.get("correo", "").lower())
    nombre_completo = trim_or_none(data.get("nombre_completo"))
    password = data.get("password", "")
    password_confirm = data.get("password_confirm", "")
    archivo = request.files.get("foto_perfil")

    if not correo or not nombre_completo or not password or not password_confirm:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    if not EMAIL_REGEX.match(correo):
        return jsonify({"error": "Formato de correo invalido"}), 400

    if password != password_confirm:
        return jsonify({"error": "Las contrasenas no coinciden"}), 400

    if archivo and not allowed_file(archivo.filename):
        return jsonify({"error": "Formato no permitido. Usa jpg, jpeg, png o webp"}), 400

    foto_perfil = upload_profile_photo(archivo) if archivo else trim_or_none(data.get("foto_perfil"))

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
        return jsonify({"error": "El correo ya esta registrado"}), 409

    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = get_payload()
    if data is None:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    correo = trim_or_none(data.get("correo", "").lower())
    password = data.get("password", "")

    if not correo or not password:
        return jsonify({"error": "Correo y contrasena son obligatorios"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM sp_login(%s, %s)", (correo, password))
        usuario = cursor.fetchone()

        if not usuario:
            return jsonify({"error": "Correo o contrasena incorrectos"}), 401

        usuario["foto_perfil"] = build_image_url(usuario["foto_perfil"])
        return jsonify(usuario), 200

    finally:
        cursor.close()
        conn.close()


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = get_payload()
    if data is None:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    correo = trim_or_none(data.get("correo", "").lower())
    nueva_password = data.get("nueva_password", "")
    nueva_password_confirm = data.get("nueva_password_confirm", "")

    if not correo or not nueva_password or not nueva_password_confirm:
        return (
            jsonify(
                {"error": "correo, nueva_password y nueva_password_confirm son obligatorios"}
            ),
            400,
        )

    if nueva_password != nueva_password_confirm:
        return jsonify({"error": "Las contrasenas nuevas no coinciden"}), 400

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


@auth_bp.route("/obtenerUsuarios", methods=["GET"])
def obtener_usuarios():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT * FROM sp_listar_usuarios()")
        usuarios = cursor.fetchall()

        for u in usuarios:
            u["foto_perfil"] = build_image_url(u["foto_perfil"])

        return jsonify(usuarios), 200

    finally:
        cursor.close()
        conn.close()
