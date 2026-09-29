import psycopg2
from flask import Blueprint, request, jsonify
from db import call_sp, UNIQUE_VIOLATION
from services.storage_service import upload_file
from utils.auth_middleware import err, make_token
from utils.serialize import user_to_dict, text

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.post("/register")
def register():
    data = request.form if request.form else (request.get_json(silent=True) or {})
    username = text(data.get("username"))
    email = text(data.get("email"))
    password = data.get("password") or ""
    confirm = data.get("confirmPassword") or ""

    if not username or not email or not password:
        return err("username, email y password son obligatorios", 400)
    if password != confirm:
        return err("Las contraseñas no coinciden", 400)

    image_url = text(data.get("profileImageUrl")) or None
    if "profileImage" in request.files:
        image_url = upload_file(request.files["profileImage"], "profiles")

    try:
        # El SP encripta la contraseña con bcrypt (pgcrypto)
        rows = call_sp("sp_registrar_usuario", username, email, password, image_url)
    except psycopg2.Error as e:
        if e.pgcode == UNIQUE_VIOLATION:
            return err("El nombre de usuario ya existe", 409)
        raise
    return jsonify({"message": "Usuario registrado", "user": user_to_dict(rows[0])}), 201

@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    rows = call_sp("sp_login", data.get("username") or "", data.get("password") or "")
    if not rows:
        return err("Credenciales inválidas", 401)
    user = rows[0]
    return jsonify({"token": make_token(user), "user": user_to_dict(user)})
