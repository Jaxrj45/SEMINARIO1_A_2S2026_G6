from datetime import datetime, timedelta, timezone

import jwt
from flask import g, request

from config import Config
from utils.http import fail


def make_token(user):
    """sub va como texto: PyJWT rechaza el token si sub es numero."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user["id"]),
        "username": user["username"],
        "iat": now,
        "exp": now + timedelta(hours=Config.JWT_HOURS),
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")


def read_token(token):
    """Devuelve (user_id, username). Lanza ExpiredSignatureError o InvalidTokenError si no sirve.
    Tambien lo usa el WebSocket del chat, que recibe el token en la URL."""
    data = jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
    try:
        user_id = int(data.get("sub"))
    except (TypeError, ValueError):
        raise jwt.InvalidTokenError("sub invalido")
    if user_id <= 0:
        raise jwt.InvalidTokenError("sub invalido")
    return user_id, str(data.get("username") or "")


def require_auth():
    """Para usar en before_request de un blueprint: si no hay sesion devuelve la respuesta de error.
    Deja pasar OPTIONS para que el navegador pueda hacer el preflight de CORS."""
    if request.method == "OPTIONS":
        return None

    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return fail(401, "UNAUTHORIZED", "Debes iniciar sesión")

    try:
        g.user_id, g.username = read_token(header[7:])
    except jwt.ExpiredSignatureError:
        return fail(401, "TOKEN_EXPIRED", "Tu sesión expiró, vuelve a iniciar sesión")
    except jwt.InvalidTokenError:
        return fail(401, "UNAUTHORIZED", "Sesión inválida")
    return None
