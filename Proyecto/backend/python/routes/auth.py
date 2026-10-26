from flask import Blueprint

from db import is_duplicate, run
from services.cognito import assert_cognito_confirmed, assert_cognito_signup, verify_id_token
from services.face_api import compare_face
from services.users import find_user_by_cognito_sub, find_user_by_id, find_user_by_username
from utils.auth import make_token
from utils.format import text
from utils.http import ApiError, get_body, ok
from utils.serialize import user_to_json
from utils.validate import (
    DPI_RE,
    EMAIL_RE,
    MIN_PASSWORD,
    USERNAME_RE,
    clean_base64,
    throw_if_invalid,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _session_data(user):
    """Respuesta de login: nuestro token + el perfil."""
    return {"token": make_token(user), "user": user_to_json(user)}


def _duplicate_error(error):
    """Cual campo UNIQUE se repitio, segun el nombre del indice en schema.sql."""
    message = str(error.args[1]) if len(error.args) > 1 else ""
    fields = {}
    if "uq_usuarios_username" in message:
        fields["username"] = "Ya está en uso"
    if "uq_usuarios_email" in message:
        fields["email"] = "Ya está registrado"
    if "uq_usuarios_dpi" in message:
        fields["dpi"] = "Ya está registrado"
    if "uq_usuarios_cognito_sub" in message:
        fields["cognitoSub"] = "Ya está registrado"
    return ApiError(409, "ALREADY_EXISTS", "El usuario, correo o DPI ya está registrado", fields)


@auth_bp.post("/register")
def register():
    """El frontend ya subio la foto (upload/profile) y ya hizo el signUp en Cognito."""
    body = get_body()
    password = body.get("password")
    data = {
        "username": text(body.get("username")),
        "fullName": text(body.get("fullName")),
        "email": text(body.get("email")).lower(),
        "dpi": text(body.get("dpi")),
        "password": password if isinstance(password, str) else "",
        "cognitoSub": text(body.get("cognitoSub")),
        "photoKey": text(body.get("photoKey")),
    }

    fields = {}
    if not USERNAME_RE.fullmatch(data["username"]):
        fields["username"] = "De 3 a 50 caracteres: letras, números, punto, guion o guion bajo"
    if not data["fullName"] or len(data["fullName"]) > 150:
        fields["fullName"] = "Es obligatorio (máximo 150 caracteres)"
    if not EMAIL_RE.fullmatch(data["email"]) or len(data["email"]) > 150:
        fields["email"] = "Correo inválido"
    if not DPI_RE.fullmatch(data["dpi"]):
        fields["dpi"] = "Debe tener 13 dígitos"
    if len(data["password"]) < MIN_PASSWORD:
        fields["password"] = f"Mínimo {MIN_PASSWORD} caracteres"
    if not data["cognitoSub"]:
        fields["cognitoSub"] = "Es obligatorio"
    if not data["photoKey"].startswith("Fotos_Perfil/"):
        fields["photoKey"] = "La foto de perfil es obligatoria"
    throw_if_invalid(fields)

    assert_cognito_signup(data["username"], data["cognitoSub"])

    try:
        user_id = run(
            """INSERT INTO usuarios (cognito_sub, username, nombre_completo, email, dpi, password_md5, foto_key)
               VALUES (%s, %s, %s, %s, %s, MD5(%s), %s)""",
            (
                data["cognitoSub"],
                data["username"],
                data["fullName"],
                data["email"],
                data["dpi"],
                data["password"],
                data["photoKey"],
            ),
        )
    except Exception as e:
        if is_duplicate(e):
            raise _duplicate_error(e)
        raise

    user = find_user_by_id(user_id)
    return ok(
        "Usuario registrado. Revisa tu correo para verificar la cuenta.",
        {"user": user_to_json(user)},
        201,
    )


@auth_bp.post("/session")
def session():
    """Login con usuario y contrasena: el frontend inicia sesion en Cognito y manda el idToken."""
    id_token = text(get_body().get("idToken"))
    throw_if_invalid({} if id_token else {"idToken": "Es obligatorio"})

    cognito = verify_id_token(id_token)
    user = find_user_by_cognito_sub(cognito["sub"])
    if not user:
        raise ApiError(401, "UNAUTHORIZED", "El usuario no está registrado en Semi-Social")

    return ok("Sesión iniciada", _session_data(user))


@auth_bp.post("/face-session")
def face_session():
    """Login facial: compara la foto de la camara con la foto de perfil."""
    body = get_body()
    username = text(body.get("username"))
    image = body.get("imageBase64")
    image_base64 = clean_base64(image) if isinstance(image, str) else ""

    fields = {}
    if not username:
        fields["username"] = "Es obligatorio"
    if not image_base64:
        fields["imageBase64"] = "La foto es obligatoria"
    throw_if_invalid(fields)

    # Mismo mensaje si no existe el usuario o si no es su cara, para no revelar quien esta registrado
    user = find_user_by_username(username)
    if not user:
        raise ApiError(401, "INVALID_CREDENTIALS", "Usuario o rostro incorrecto")

    assert_cognito_confirmed(user["username"])

    result = compare_face(image_base64, user["foto_key"])
    if not result["match"]:
        raise ApiError(401, "FACE_NOT_MATCHED", "El rostro no coincide con la foto de perfil")

    return ok("Sesión iniciada", _session_data(user))
