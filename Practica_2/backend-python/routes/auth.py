import bcrypt
from flask import Blueprint, request, jsonify
from extensions import db
from models.user import User
from services.s3_service import upload_to_s3
from utils.auth_middleware import err, make_token

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.post("/register")
def register():
    data = request.form if request.form else (request.get_json(silent=True) or {})
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    confirm = data.get("confirmPassword") or ""

    if not username or not email or not password:
        return err("username, email y password son obligatorios", 400)
    if password != confirm:
        return err("Las contraseñas no coinciden", 400)
    if User.query.filter_by(username=username).first():
        return err("El nombre de usuario ya existe", 409)

    image_url = data.get("profileImageUrl")
    if "profileImage" in request.files:
        image_url = upload_to_s3(request.files["profileImage"], "profiles")

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user = User(username=username, email=email, password_hash=hashed, profile_image_url=image_url)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Usuario registrado", "user": user.to_dict()}), 201

@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    user = User.query.filter_by(username=data.get("username", "")).first()
    if not user or not bcrypt.checkpw((data.get("password") or "").encode(), user.password_hash.encode()):
        return err("Credenciales inválidas", 401)
    return jsonify({"token": make_token(user), "user": user.to_dict()})