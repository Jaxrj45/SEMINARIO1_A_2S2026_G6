import jwt
import datetime as dt
from functools import wraps
from flask import request, jsonify, g
from config import Config

def err(msg, code):
    return jsonify({"error": msg}), code

def make_token(user):
    payload = {
        "sub": str(user.id),
        "username": user.username,
        "exp": dt.datetime.utcnow() + dt.timedelta(hours=Config.JWT_HOURS)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")

def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return err("Token requerido", 401)
        try:
            data = jwt.decode(header[7:], Config.JWT_SECRET, algorithms=["HS256"])
            g.user_id = int(data["sub"])
        except Exception:
            return err("Token inválido o expirado", 401)
        return fn(*args, **kwargs)
    return wrapper

def file_category(mimetype):
    if mimetype.startswith("image/"):
        return "image"
    if mimetype.startswith("text/"):
        return "text"
    return "other"