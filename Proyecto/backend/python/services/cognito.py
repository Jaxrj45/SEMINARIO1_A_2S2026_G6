import boto3
import jwt

from config import Config
from utils.http import ApiError

# En la compu se puede trabajar sin Cognito: si COGNITO_USER_POOL_ID esta vacio
# se saltan las revisiones contra Cognito. En la EC2 siempre tiene que estar.
cognito_enabled = bool(Config.COGNITO_USER_POOL_ID and Config.COGNITO_CLIENT_ID)

if not cognito_enabled:
    print("[cognito] COGNITO_USER_POOL_ID o COGNITO_CLIENT_ID vacio: no se revisa nada contra Cognito")

# Sin llaves: en la EC2 usa el rol Semi-EC2-AppRole
_client = boto3.client("cognito-idp", region_name=Config.AWS_REGION)

_issuer = f"https://cognito-idp.{Config.AWS_REGION}.amazonaws.com/{Config.COGNITO_USER_POOL_ID}"
_jwks_client = None


def _get_jwks_client():
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = jwt.PyJWKClient(f"{_issuer}/.well-known/jwks.json")
    return _jwks_client


def verify_id_token(id_token):
    """Valida el idToken que manda el frontend despues de iniciar sesion en Cognito."""
    if not cognito_enabled:
        raise ApiError(502, "UPSTREAM_ERROR", "Cognito no está configurado en el servidor")
    try:
        key = _get_jwks_client().get_signing_key_from_jwt(id_token).key
        payload = jwt.decode(
            id_token,
            key,
            algorithms=["RS256"],
            audience=Config.COGNITO_CLIENT_ID,
            issuer=_issuer,
        )
        if payload.get("token_use") != "id":
            raise jwt.InvalidTokenError("no es un idToken")
    except Exception:
        raise ApiError(401, "UNAUTHORIZED", "La sesión de Cognito no es válida")
    return {"sub": payload["sub"], "username": str(payload.get("cognito:username") or "")}


def get_cognito_user(username):
    """Devuelve {"sub", "status"} o None si no existe. status: CONFIRMED, UNCONFIRMED, etc."""
    try:
        result = _client.admin_get_user(UserPoolId=Config.COGNITO_USER_POOL_ID, Username=username)
    except _client.exceptions.UserNotFoundException:
        return None
    except Exception as e:
        print("[cognito] AdminGetUser:", e)
        raise ApiError(502, "UPSTREAM_ERROR", "No se pudo consultar Cognito")

    sub = next((a["Value"] for a in result.get("UserAttributes", []) if a["Name"] == "sub"), "")
    return {"sub": sub, "status": result.get("UserStatus", "")}


def assert_cognito_signup(username, cognito_sub):
    """Registro: el usuario tiene que existir en Cognito con ese sub."""
    if not cognito_enabled:
        return
    user = get_cognito_user(username)
    if not user or user["sub"] != cognito_sub:
        raise ApiError(
            400,
            "VALIDATION_ERROR",
            "El usuario no está registrado en Cognito",
            {"cognitoSub": "No coincide con el usuario de Cognito"},
        )


def assert_cognito_confirmed(username):
    """Login facial: la cuenta tiene que tener el correo verificado."""
    if not cognito_enabled:
        return
    user = get_cognito_user(username)
    if not user:
        raise ApiError(401, "INVALID_CREDENTIALS", "Usuario o rostro incorrecto")
    if user["status"] != "CONFIRMED":
        raise ApiError(403, "EMAIL_NOT_VERIFIED", "Debes verificar tu correo antes de iniciar sesión")


def update_cognito_user(username, full_name=None, dpi=None):
    """Editar perfil: nombre y DPI tambien se guardan en Cognito."""
    if not cognito_enabled:
        return

    attributes = []
    if full_name is not None:
        attributes.append({"Name": "name", "Value": full_name})
    if dpi is not None:
        attributes.append({"Name": "custom:dpi", "Value": dpi})
    if not attributes:
        return

    try:
        _client.admin_update_user_attributes(
            UserPoolId=Config.COGNITO_USER_POOL_ID,
            Username=username,
            UserAttributes=attributes,
        )
    except Exception as e:
        print("[cognito] AdminUpdateUserAttributes:", e)
        raise ApiError(502, "UPSTREAM_ERROR", "No se pudo actualizar el usuario en Cognito")
