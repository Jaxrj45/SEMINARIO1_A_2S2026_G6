import re
import hashlib
from flask import Blueprint, request, jsonify
from src.db import get_db_connection

auth_bp = Blueprint("auth", __name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Cuerpo JSON requerido"}), 400

    correo = data.get("correo", "").strip().lower()
    nombre_completo = data.get("nombre_completo", "").strip()
    password = data.get("password", "")
    password_confirm = data.get("password_confirm", "")
    foto_perfil_url = data.get("foto_perfil_url")  # Para AWS S3

    # --- Validaciones ---
    if not correo or not nombre_completo or not password or not password_confirm:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    if not EMAIL_REGEX.match(correo):
        return jsonify({"error": "Formato de correo inválido"}), 400

    if password != password_confirm:
        return jsonify({"error": "Las contraseñas no coinciden"}), 400

    # --- Encriptación MD5 ---
    password_hash = hashlib.md5(password.encode("utf-8")).hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Verificar que el correo no exista ya
        cursor.execute("SELECT id FROM usuarios WHERE correo = %s", (correo,))
        if cursor.fetchone():
            return jsonify({"error": "El correo ya está registrado"}), 409

        cursor.execute(
            """
            INSERT INTO usuarios (correo, nombre_completo, password_hash, foto_perfil_url)
            VALUES (%s, %s, %s, %s)
            """,
            (correo, nombre_completo, password_hash, foto_perfil_url),
        )
        conn.commit()
        nuevo_id = cursor.lastrowid

        return jsonify({
            "id": nuevo_id,
            "correo": correo,
            "nombre_completo": nombre_completo,
            "foto_perfil_url": foto_perfil_url,
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Error en el servidor: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()